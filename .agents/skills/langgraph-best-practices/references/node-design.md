# Node Design (nodes-)

## Rule: Nodes are Async Functions That Return Partial State

**Why it matters:** Every node is `(state) => Promise<Partial<State>>`. Keep them focused on one task. Complex logic goes into helper functions, not the node itself.

### ❌ Incorrect — Monolithic Node

```typescript
const doEverythingNode = async (state) => {
  // ❌ Too many responsibilities in one node
  const images = await uploadImages(state.files)
  const visionResult = await analyzeImages(images)
  const services = await getServices()
  const price = calculatePrice(services, visionResult)
  const summary = await generateSummary(price)
  await saveToDatabase(summary)
  return { images, visionResult, services, price, summary }
}
```

### ✅ Correct — Single Responsibility Nodes

```typescript
const validatePhotoNode = async (state) => {
  const lastImage = state.images[state.images.length - 1]
  const isValid = await visionModel.invoke([
    new HumanMessage({
      content: [
        { type: "text", text: `Is this a ${state.currentStep.replace("upload_", "")} view of a car? Answer only YES or NO.` },
        { type: "image_url", image_url: { url: lastImage.url } },
      ],
    }),
  ])

  if (isValid.content.trim().toUpperCase() !== "YES") {
    return { errors: [`Expected ${state.currentStep.replace("upload_", "")} view, got something else`] }
  }

  return {
    images: [{ ...lastImage, validated: true }],
    currentStep: getNextStep(state.currentStep),
  }
}

const analyzeVisionNode = async (state) => {
  const analysis = await analyzeCarImages(state.images)
  return {
    carSize: analysis.size,
    dirtLevel: analysis.dirt,
    paintCondition: analysis.paint,
    detectedIssues: analysis.issues,
    currentStep: "select_services",
  }
}

const calculatePriceNode = async (state) => {
  const services = await getServicesByIds(state.acceptedServices)
  const breakdown = calculatePriceBreakdown(services, state.carSize, state.dirtLevel)
  return {
    priceMin: breakdown.min,
    priceMax: breakdown.max,
    durationHours: breakdown.hours,
    servicesBreakdown: breakdown.items,
    currentStep: "generate_summary",
  }
}
```

---

## Rule: Error Handling in Nodes

**Why it matters:** Nodes should catch errors and update state with error information, not throw. This allows the graph to route to error recovery nodes.

```typescript
const analyzeVisionNode = async (state) => {
  try {
    const analysis = await visionModel.invoke([
      new HumanMessage({
        content: [
          { type: "text", text: "Analyze this car's condition..." },
          ...state.images.map(img => ({
            type: "image_url" as const,
            image_url: { url: img.url },
          })),
        ],
      }),
    ])

    return {
      carSize: analysis.size,
      dirtLevel: analysis.dirt,
      paintCondition: analysis.paint,
    }
  } catch (error) {
    return {
      errors: [...state.errors, `Vision analysis failed: ${error.message}`],
    }
  }
}
```

---

## Rule: Retry Policies for Unreliable Nodes

**Why it matters:** Network calls, API requests, and LLM invocations can fail transiently. Add retry policies to nodes that make external calls.

```typescript
const workflow = new StateGraph(CarAssessmentState)
  .addNode("validatePhoto", validatePhotoNode)
  .addNode(
    "analyzeVision",
    analyzeVisionNode,
    {
      retryPolicy: {
        maxAttempts: 3,
        initialInterval: 1000,    // 1 second
        backoffFactor: 2,         // Exponential backoff: 1s, 2s, 4s
        maxInterval: 10000,       // Max 10 seconds
      },
    }
  )
  .addNode(
    "calculatePrice",
    calculatePriceNode,
    { retryPolicy: { maxAttempts: 2 } }
  )
```

---

## Rule: Node Input/Output Contract

```typescript
import { GraphNode } from "@langchain/langgraph"

// Explicitly type your nodes
const validatePhotoNode: GraphNode<typeof CarAssessmentState> = async (state) => {
  // state is fully typed — all fields accessible
  // Return type is Partial<CarAssessmentState.State>
  return {
    currentStep: "upload_rear",
    // Only return what changed
  }
}
```

---

## Rule: Node Naming Conventions

| Pattern | Example | When to Use |
|---------|---------|-------------|
| `verbNoun` | `validatePhoto`, `calculatePrice` | Action nodes |
| `nounState` | `showError`, `displayResults` | UI/display nodes |
| `routeX` | `routeAfterValidation` | Router functions |
| `shouldX` | `shouldContinue`, `shouldRetry` | Conditional edge routers |

---

## References
- https://docs.langchain.com/oss/javascript/langgraph/use-graph-api
- https://docs.langchain.com/oss/javascript/langgraph/thinking-in-langgraph