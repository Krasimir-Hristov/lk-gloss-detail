# Parallel Execution — Send API (parallel-)

## Rule: Use `Send` for Dynamic Parallelism

**Why it matters:** When you don't know how many parallel workers you need at compile time, use `Send` in conditional edge routers. This dynamically spawns worker nodes based on state.

### ❌ Incorrect — Sequential Processing

```typescript
// Processes services one at a time — slow!
const processServicesNode = async (state) => {
  const results = [];
  for (const serviceId of state.acceptedServices) {
    const result = await analyzeService(
      serviceId,
      state.carSize,
      state.dirtLevel,
    );
    results.push(result);
  }
  return { servicesBreakdown: results };
};
```

### ✅ Correct — Parallel with Send API

```typescript
import { Send } from '@langchain/langgraph';

// Worker node: processes ONE service
const analyzeServiceNode = async (state: typeof WorkerState.State) => {
  const service = await getService(state.serviceId);
  const price = calculatePrice(service, state.carSize, state.dirtLevel);

  return {
    completedServices: [
      {
        serviceId: state.serviceId,
        name: service.name,
        price,
        included: true,
      },
    ],
  };
};

// Router: spawn one worker per service
const spawnServiceWorkers: ConditionalEdgeRouter<
  typeof CarAssessmentState,
  'analyzeService'
> = (state) => {
  return state.acceptedServices.map(
    (serviceId) =>
      new Send('analyzeService', {
        serviceId,
        carSize: state.carSize,
        dirtLevel: state.dirtLevel,
      }),
  );
};

// Worker state (subset of main state)
const WorkerState = new StateSchema({
  serviceId: z.string(),
  carSize: z.enum(['small', 'medium', 'large', 'suv']),
  dirtLevel: z.enum(['light', 'medium', 'heavy']),
  completedServices: new ReducedValue(
    z
      .array(
        z.object({
          serviceId: z.string(),
          name: z.string(),
          price: z.number(),
          included: z.boolean(),
        }),
      )
      .default(() => []),
    { reducer: (existing, incoming) => [...existing, ...incoming] },
  ),
});

const workflow = new StateGraph(CarAssessmentState)
  .addNode('prepareServices', prepareServicesNode)
  .addNode('analyzeService', analyzeServiceNode)
  .addNode('aggregateResults', aggregateResultsNode)
  .addEdge(START, 'prepareServices')
  .addConditionalEdges('prepareServices', spawnServiceWorkers, [
    'analyzeService',
  ])
  .addEdge('analyzeService', 'aggregateResults')
  .addEdge('aggregateResults', END)
  .compile();
```

---

## Rule: Orchestrator-Worker Pattern

**Why it matters:** An orchestrator node plans the work, then spawns parallel workers via Send. Results are aggregated by a synthesizer node.

```typescript
// Orchestrator: plans what needs to be done
const orchestratorNode = async (state) => {
  const plan = await planner.invoke([
    new SystemMessage(
      'Plan the car assessment. Return a list of analysis tasks.',
    ),
    new HumanMessage(`Car size: ${state.carSize}, dirt: ${state.dirtLevel}`),
  ]);

  return { tasks: plan.tasks };
};

// Router: spawn workers for each task
const assignWorkers: ConditionalEdgeRouter<typeof State, 'worker'> = (
  state,
) => {
  return state.tasks.map((task) => new Send('worker', { task }));
};

// Worker: executes one task
const workerNode = async (state: typeof WorkerState.State) => {
  const result = await executeTask(state.task);
  return { completedTasks: [result] };
};

// Synthesizer: combines all results
const synthesizerNode = async (state) => {
  const combined = synthesizeResults(state.completedTasks);
  return { finalResult: combined };
};
```

---

## Rule: Map-Reduce Pattern with Send

**Why it matters:** Map phase spawns parallel workers, reduce phase combines results. This is the most common parallel pattern in LangGraph.

```typescript
// Map: spawn workers
const mapRouter: ConditionalEdgeRouter<typeof State, 'processChunk'> = (
  state,
) => {
  const chunks = splitIntoChunks(state.data, 5);
  return chunks.map(
    (chunk, i) => new Send('processChunk', { chunk, index: i }),
  );
};

// Reduce: combine results
const reduceNode = async (state) => {
  const sorted = state.processedChunks
    .sort((a, b) => a.index - b.index)
    .map((c) => c.result)
    .join('\n');

  return { finalOutput: sorted };
};
```

---

## Rule: Parallel Execution Limits

**Why it matters:** Too many parallel workers can overwhelm APIs (rate limits) or memory. Control parallelism with batching.

```typescript
// Instead of spawning 100 workers at once, batch them
const batchedRouter: ConditionalEdgeRouter<typeof State, 'worker'> = (
  state,
) => {
  const batchSize = 5;
  const batch = state.pendingItems.slice(0, batchSize);

  return batch.map((item) => new Send('worker', { item }));
};

// After each batch completes, the router is called again
// with remaining items until all are processed
```

---

## References

- https://docs.langchain.com/oss/javascript/langgraph/workflows-agents
- https://langchain-ai.github.io/langgraphjs/how-tos/map-reduce
