# Graph Architecture (graph-)

## Rule: Every Graph Has Entry and Exit Points

**Why it matters:** LangGraph requires explicit `START → firstNode` and `lastNode → END` edges. Forgetting these causes runtime errors.

### ❌ Incorrect — Missing START/END Edges

```typescript
const graph = new StateGraph(State)
  .addNode('processA', processA)
  .addNode('processB', processB)
  .addEdge('processA', 'processB')
  .compile();
// 💥 Error: No edge from START to any node
```

### ✅ Correct — Explicit START and END

```typescript
const graph = new StateGraph(State)
  .addNode('processA', processA)
  .addNode('processB', processB)
  .addEdge(START, 'processA') // Entry point
  .addEdge('processA', 'processB')
  .addEdge('processB', END) // Exit point
  .compile();
```

---

## Rule: Linear Workflow (Fixed Steps)

**Why it matters:** For straightforward pipelines where each step always follows the previous one, use fixed edges.

```typescript
const analysisWorkflow = new StateGraph(CarAssessmentState)
  .addNode('validatePhoto', validatePhotoNode)
  .addNode('analyzeVision', analyzeVisionNode)
  .addNode('selectServices', selectServicesNode)
  .addNode('calculatePrice', calculatePriceNode)
  .addNode('generateSummary', generateSummaryNode)
  .addEdge(START, 'validatePhoto')
  .addEdge('validatePhoto', 'analyzeVision')
  .addEdge('analyzeVision', 'selectServices')
  .addEdge('selectServices', 'calculatePrice')
  .addEdge('calculatePrice', 'generateSummary')
  .addEdge('generateSummary', END)
  .compile();
```

---

## Rule: Branching with Conditional Edges

**Why it matters:** Use conditional edges when the next step depends on state. The router function receives the full state and returns the next node name(s).

```typescript
import { ConditionalEdgeRouter } from '@langchain/langgraph';

// Router: decide which step comes next
const routeAfterValidation: ConditionalEdgeRouter<typeof CarAssessmentState> = (
  state,
) => {
  if (state.errors.length > 0) {
    return 'showError'; // Retry on error
  }

  switch (state.currentStep) {
    case 'upload_front':
      return 'upload_rear';
    case 'upload_rear':
      return 'upload_side';
    case 'upload_side':
      return 'upload_interior';
    case 'upload_interior':
      return 'analyzeVision';
    default:
      return END;
  }
};

const workflow = new StateGraph(CarAssessmentState)
  .addNode('validatePhoto', validatePhotoNode)
  .addNode('upload_rear', uploadRearNode)
  .addNode('upload_side', uploadSideNode)
  .addNode('upload_interior', uploadInteriorNode)
  .addNode('analyzeVision', analyzeVisionNode)
  .addNode('showError', showErrorNode)
  .addEdge(START, 'validatePhoto')
  .addConditionalEdges('validatePhoto', routeAfterValidation, [
    'upload_rear',
    'upload_side',
    'upload_interior',
    'analyzeVision',
    'showError',
    END,
  ])
  .addEdge('upload_rear', 'validatePhoto') // Loop back for next photo
  .addEdge('upload_side', 'validatePhoto')
  .addEdge('upload_interior', 'validatePhoto')
  .addEdge('analyzeVision', END)
  .addEdge('showError', 'validatePhoto') // Retry on error
  .compile();
```

---

## Rule: Loops with Termination Conditions

**Why it matters:** Graphs can loop back on themselves, but must have a clear termination condition to prevent infinite loops.

```typescript
const routeAfterValidation: ConditionalEdgeRouter<typeof CarAssessmentState> = (
  state,
) => {
  // Termination condition: 4 validated images
  const validatedCount = state.images.filter((img) => img.validated).length;
  if (validatedCount >= 4) {
    return 'analyzeVision'; // All photos done → proceed to analysis
  }

  // Continue collecting photos
  const nextStep = {
    0: 'upload_front',
    1: 'upload_rear',
    2: 'upload_side',
    3: 'upload_interior',
  }[validatedCount];

  return nextStep || END;
};
```

---

## Rule: Command-Based Routing (Alternative to Conditional Edges)

**Why it matters:** Command-based routing keeps routing logic inside nodes, making graphs cleaner when a node needs to dynamically choose its successor.

```typescript
import { Command } from '@langchain/langgraph';

const validatePhotoNode: GraphNode<typeof CarAssessmentState> = async (
  state,
) => {
  const isValid = await validatePhoto(state.images[state.images.length - 1]);

  if (!isValid) {
    // Return Command to go to error node with update
    return new Command({
      update: { errors: [...state.errors, 'Invalid photo angle'] },
      goto: 'showError',
    });
  }

  const validatedCount = state.images.filter((img) => img.validated).length + 1;

  if (validatedCount >= 4) {
    return new Command({ goto: 'analyzeVision' });
  }

  const nextNode = {
    1: 'upload_rear',
    2: 'upload_side',
    3: 'upload_interior',
  }[validatedCount];

  return new Command({ goto: nextNode });
};

const workflow = new StateGraph(CarAssessmentState)
  .addNode('validatePhoto', validatePhotoNode, {
    ends: [
      'upload_rear',
      'upload_side',
      'upload_interior',
      'analyzeVision',
      'showError',
    ],
  })
  .addEdge(START, 'validatePhoto')
  // No conditional edges needed! Routing is in the node via Command
  .compile();
```

---

## Rule: Graph Design Checklist

1. ✅ Every graph has `START → firstNode` edge
2. ✅ Every terminal path ends with `→ END`
3. ✅ All possible routes are listed in conditional edge targets array
4. ✅ Loops have clear termination conditions
5. ✅ State carries enough information for routing decisions
6. ✅ Nodes are focused — one responsibility per node

---

## References

- https://docs.langchain.com/oss/javascript/langgraph/use-graph-api
- https://docs.langchain.com/oss/javascript/langgraph/thinking-in-langgraph
