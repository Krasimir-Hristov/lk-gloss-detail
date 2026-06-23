# Subgraphs & Composition (subgraph-)

## Rule: Use Subgraphs for Reusable Workflows

**Why it matters:** Subgraphs encapsulate reusable logic. Instead of duplicating nodes across graphs, compose them as subgraphs.

```typescript
// Define a reusable photo validation subgraph
const photoValidationSubgraph = new StateGraph(PhotoValidationState)
  .addNode('validateAngle', validateAngleNode)
  .addNode('checkQuality', checkQualityNode)
  .addNode('showError', showErrorNode)
  .addEdge(START, 'validateAngle')
  .addConditionalEdges('validateAngle', routeAfterAngleCheck, [
    'checkQuality',
    'showError',
  ])
  .addConditionalEdges('checkQuality', routeAfterQualityCheck, [
    END,
    'showError',
  ])
  .addEdge('showError', END)
  .compile();

// Use subgraph in parent graph
const assessmentWorkflow = new StateGraph(CarAssessmentState)
  .addNode('validateFrontPhoto', photoValidationSubgraph) // Reuse!
  .addNode('validateRearPhoto', photoValidationSubgraph) // Reuse!
  .addNode('validateSidePhoto', photoValidationSubgraph) // Reuse!
  .addNode('validateInteriorPhoto', photoValidationSubgraph) // Reuse!
  .addEdge(START, 'validateFrontPhoto')
  .addEdge('validateFrontPhoto', 'validateRearPhoto')
  .addEdge('validateRearPhoto', 'validateSidePhoto')
  .addEdge('validateSidePhoto', 'validateInteriorPhoto')
  .addEdge('validateInteriorPhoto', END)
  .compile();
```

---

## Rule: Subgraph State Mapping

**Why it matters:** Subgraphs have their own state schema. You need to map parent state fields to subgraph state fields.

```typescript
// Parent state
const ParentState = new StateSchema({
  images: z.array(z.object({ url: z.string(), angle: z.string() })),
  currentImageIndex: z.number().default(0),
  errors: z.array(z.string()).default([]),
});

// Subgraph state (subset of parent)
const SubgraphState = new StateSchema({
  imageUrl: z.string(),
  expectedAngle: z.string(),
  isValid: z.boolean().default(false),
  errorMessage: z.string().default(''),
});

// When invoking subgraph, map parent → subgraph state
const validatePhotoNode = async (state: typeof ParentState.State) => {
  const currentImage = state.images[state.currentImageIndex];

  // Invoke subgraph with mapped state
  const result = await photoValidationSubgraph.invoke({
    imageUrl: currentImage.url,
    expectedAngle: currentImage.angle,
  });

  return {
    images: state.images.map((img, i) =>
      i === state.currentImageIndex
        ? { ...img, validated: result.isValid }
        : img,
    ),
    errors: result.errorMessage
      ? [...state.errors, result.errorMessage]
      : state.errors,
  };
};
```

---

## Rule: Streaming from Subgraphs

**Why it matters:** When streaming from a parent graph, subgraph events are included automatically. Use `streamEvents` with `v3` for full subgraph visibility.

```typescript
// Stream from parent — subgraph events are included
const events = graph.streamEvents(initialState, {
  ...config,
  version: 'v3',
});

for await (const event of events) {
  // event.metadata.checkpoint_ns shows subgraph path
  // e.g., ["validateFrontPhoto", "validateAngle"]
  console.log(
    `[${event.metadata.checkpoint_ns?.join(' > ')}] ${event.event}: ${event.name}`,
  );
}
```

---

## Rule: When to Use Subgraphs vs. Nodes

| Scenario                               | Use      |
| -------------------------------------- | -------- |
| Single operation                       | Node     |
| Reusable across multiple graphs        | Subgraph |
| Complex multi-step logic within a step | Subgraph |
| Needs its own state schema             | Subgraph |
| Needs independent checkpointing        | Subgraph |
| Simple transformation                  | Node     |

---

## Rule: Nested Subgraphs

**Why it matters:** Subgraphs can contain other subgraphs. Keep nesting to 2-3 levels max for maintainability.

```typescript
// Level 3: Atomic validation
const angleCheckSubgraph = new StateGraph(AngleState)
  .addNode('classifyAngle', classifyAngleNode)
  .addEdge(START, 'classifyAngle')
  .addEdge('classifyAngle', END)
  .compile();

// Level 2: Photo validation (uses angle check)
const photoValidationSubgraph = new StateGraph(PhotoState)
  .addNode('angleCheck', angleCheckSubgraph) // Nested subgraph
  .addNode('qualityCheck', qualityCheckNode)
  .addEdge(START, 'angleCheck')
  .addEdge('angleCheck', 'qualityCheck')
  .addEdge('qualityCheck', END)
  .compile();

// Level 1: Assessment workflow (uses photo validation)
const assessmentWorkflow = new StateGraph(AssessmentState)
  .addNode('validatePhoto', photoValidationSubgraph) // Nested subgraph
  // ...
  .compile();
```

---

## References

- https://docs.langchain.com/oss/javascript/langgraph/use-graph-api#subgraphs
- https://docs.langchain.com/oss/javascript/langgraph/streaming#streaming-from-subgraphs
- https://langchain-ai.github.io/langgraphjs/how-tos/subgraph
