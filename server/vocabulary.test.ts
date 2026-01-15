import { describe, it, expect } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(userId: number = 1): TrpcContext {
  const user: AuthenticatedUser = {
    id: userId,
    openId: `test-user-${userId}`,
    email: `test${userId}@example.com`,
    name: `Test User ${userId}`,
    loginMethod: "test",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };

  return ctx;
}

describe("vocabulary router", () => {
  const ctx = createAuthContext(1);
  const caller = appRouter.createCaller(ctx);
  let testListId: number = 0;
  let testItemIds: number[] = [];

  it("should create a vocabulary list", async () => {
    const result = await caller.vocabulary.createList({
      name: "Test Vocabulary List",
      description: "A test vocabulary list",
    });

    expect(result).toBeDefined();
    
    // Get the created list ID from getLists
    const lists = await caller.vocabulary.getLists();
    const createdList = lists.find(l => l.name === "Test Vocabulary List");
    expect(createdList).toBeDefined();
    testListId = createdList!.id;
    expect(testListId).toBeGreaterThan(0);
  });

  it("should get user vocabulary lists", async () => {
    const lists = await caller.vocabulary.getLists();

    expect(Array.isArray(lists)).toBe(true);
    expect(lists.length).toBeGreaterThan(0);
    expect(lists.some(l => l.name === "Test Vocabulary List")).toBe(true);
  });

  it("should add vocabulary items to a list", async () => {
    expect(testListId).toBeGreaterThan(0);

    const result = await caller.vocabulary.addItems({
      listId: testListId,
      items: [
        { word: "Serendipity", meaning: "The occurrence of events by chance in a happy or beneficial way" },
        { word: "Ephemeral", meaning: "Lasting for a very short time" },
        { word: "Resilience", meaning: "The capacity to recover quickly from difficulties" },
      ],
    });

    expect(result).toBeDefined();
  });

  it("should get vocabulary items from a list", async () => {
    expect(testListId).toBeGreaterThan(0);

    const items = await caller.vocabulary.getItems({ listId: testListId });

    expect(Array.isArray(items)).toBe(true);
    expect(items.length).toBe(3);
    expect(items[0].word).toBe("Serendipity");
    
    // Store all item IDs for later use
    testItemIds = items.map(item => item.id);
    expect(testItemIds.length).toBe(3);
  });

  it("should record a correct learning result", async () => {
    expect(testListId).toBeGreaterThan(0);
    expect(testItemIds.length).toBeGreaterThan(0);

    const result = await caller.vocabulary.recordResult({
      itemId: testItemIds[0],
      listId: testListId,
      isCorrect: true,
      userAnswer: "The occurrence of events by chance in a happy or beneficial way",
    });

    expect(result).toBeDefined();
  });

  it("should record an incorrect learning result", async () => {
    expect(testListId).toBeGreaterThan(0);
    expect(testItemIds.length).toBeGreaterThan(0);

    const result = await caller.vocabulary.recordResult({
      itemId: testItemIds[0],
      listId: testListId,
      isCorrect: false,
      userAnswer: "Something random",
    });

    expect(result).toBeDefined();
  });

  it("should get learning statistics", async () => {
    expect(testListId).toBeGreaterThan(0);

    const stats = await caller.vocabulary.getStats({ listId: testListId });

    expect(stats).toBeDefined();
    expect(stats.totalAttempts).toBeGreaterThan(0);
    expect(stats.correctCount).toBeGreaterThan(0);
    expect(typeof stats.accuracy).toBe("number");
  });

  it("should get learning records", async () => {
    expect(testListId).toBeGreaterThan(0);

    const records = await caller.vocabulary.getRecords({ listId: testListId });

    expect(Array.isArray(records)).toBe(true);
    expect(records.length).toBeGreaterThan(0);
  });

  it("should delete vocabulary items", async () => {
    expect(testItemIds.length).toBeGreaterThan(0);

    // Delete first item
    const result = await caller.vocabulary.deleteItem({ itemId: testItemIds[0] });
    expect(result).toBeDefined();
  });

  it("should delete a vocabulary list", async () => {
    expect(testListId).toBeGreaterThan(0);

    const result = await caller.vocabulary.deleteList({ listId: testListId });

    expect(result).toBeDefined();
  });
});
