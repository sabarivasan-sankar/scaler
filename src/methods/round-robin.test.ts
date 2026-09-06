import { describe, test, expect } from "bun:test";
import roundRobin from "./round-robin";

type FakeNode = { id: number; isHealthy: boolean };

function makeNodes(count: number): FakeNode[] {
  return Array.from({ length: count }, (_, id) => ({ id, isHealthy: true }));
}

// roundRobin keeps its "last served" index in module-level state, shared across
// every test (and every other file) in the same `bun test` run. Calling it once
// here pins that state relative to `nodes`, so the rest of the test can predict
// exact outcomes without depending on what ran before it.
function prime(nodes: FakeNode[]): number {
  return (roundRobin(nodes as any) as unknown as FakeNode).id;
}

describe("roundRobin", () => {
  test("advances to the next node in order when all nodes are healthy", () => {
    const nodes = makeNodes(3);
    const first = prime(nodes);

    const second = (roundRobin(nodes as any) as unknown as FakeNode).id;
    const third = (roundRobin(nodes as any) as unknown as FakeNode).id;
    const fourth = (roundRobin(nodes as any) as unknown as FakeNode).id;

    expect(second).toBe((first + 1) % 3);
    expect(third).toBe((first + 2) % 3);
    expect(fourth).toBe(first);
  });

  test("skips unhealthy nodes", () => {
    const nodes = makeNodes(4);
    const first = prime(nodes);

    nodes[(first + 1) % 4]!.isHealthy = false;
    nodes[(first + 2) % 4]!.isHealthy = false;

    const picked = roundRobin(nodes as any) as unknown as FakeNode;

    expect(picked.id).toBe((first + 3) % 4);
  });

  test("returns null when every node is unhealthy", () => {
    const nodes = makeNodes(3);
    const first = prime(nodes);

    nodes[first]!.isHealthy = false;
    nodes[(first + 1) % 3]!.isHealthy = false;
    nodes[(first + 2) % 3]!.isHealthy = false;

    expect(roundRobin(nodes as any)).toBeNull();
  });

  test("still returns the current node when it's the only one left healthy", () => {
    const nodes = makeNodes(3);
    const first = prime(nodes);

    nodes[(first + 1) % 3]!.isHealthy = false;
    nodes[(first + 2) % 3]!.isHealthy = false;

    const picked = roundRobin(nodes as any) as unknown as FakeNode;

    expect(picked.id).toBe(first);
  });

  test("a single-node cluster keeps returning that node while it's healthy", () => {
    const nodes: FakeNode[] = [{ id: 0, isHealthy: true }];

    expect((roundRobin(nodes as any) as unknown as FakeNode).id).toBe(0);
    expect((roundRobin(nodes as any) as unknown as FakeNode).id).toBe(0);
  });

  test("returns null for an empty node list", () => {
    expect(roundRobin([])).toBeNull();
  });

  test("a recovered node is picked again once its turn comes back around", () => {
    const nodes = makeNodes(3);
    const first = prime(nodes);

    nodes[(first + 1) % 3]!.isHealthy = false;
    const skipped = roundRobin(nodes as any) as unknown as FakeNode;
    expect(skipped.id).toBe((first + 2) % 3);

    nodes[(first + 1) % 3]!.isHealthy = true;
    // Rotation continues normally and lands back on `first` first...
    const next = roundRobin(nodes as any) as unknown as FakeNode;
    expect(next.id).toBe(first);

    // ...only on the following call does the recovered node get its turn again.
    const recovered = roundRobin(nodes as any) as unknown as FakeNode;
    expect(recovered.id).toBe((first + 1) % 3);
  });
});
