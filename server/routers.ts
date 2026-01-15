import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router, protectedProcedure } from "./_core/trpc";
import { z } from "zod";
import {
  createVocabularyList,
  getUserVocabularyLists,
  getVocabularyListById,
  deleteVocabularyList,
  addVocabularyItems,
  getVocabularyItemsByListId,
  deleteVocabularyItem,
  recordLearningResult,
  getUserLearningStats,
  getUserLearningRecords,
} from "./db";
import { parsePdfVocabulary } from "./pdfParser";

export const appRouter = router({
    // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  vocabulary: router({
    createList: protectedProcedure
      .input(
        z.object({
          name: z.string().min(1, "List name is required"),
          description: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        return await createVocabularyList(ctx.user.id, input.name, input.description);
      }),
    getLists: protectedProcedure.query(async ({ ctx }) => {
      return await getUserVocabularyLists(ctx.user.id);
    }),
    getList: protectedProcedure
      .input(z.object({ listId: z.number() }))
      .query(async ({ input }) => {
        return await getVocabularyListById(input.listId);
      }),
    deleteList: protectedProcedure
      .input(z.object({ listId: z.number() }))
      .mutation(async ({ input }) => {
        return await deleteVocabularyList(input.listId);
      }),
    addItems: protectedProcedure
      .input(
        z.object({
          listId: z.number(),
          items: z.array(
            z.object({
              word: z.string().min(1),
              meaning: z.string().min(1),
            })
          ),
        })
      )
      .mutation(async ({ input }) => {
        return await addVocabularyItems(input.listId, input.items);
      }),
    getItems: protectedProcedure
      .input(z.object({ listId: z.number() }))
      .query(async ({ input }) => {
        return await getVocabularyItemsByListId(input.listId);
      }),
    deleteItem: protectedProcedure
      .input(z.object({ itemId: z.number() }))
      .mutation(async ({ input }) => {
        return await deleteVocabularyItem(input.itemId);
      }),
    recordResult: protectedProcedure
      .input(
        z.object({
          itemId: z.number(),
          listId: z.number(),
          isCorrect: z.boolean(),
          userAnswer: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        return await recordLearningResult(
          ctx.user.id,
          input.itemId,
          input.listId,
          input.isCorrect,
          input.userAnswer
        );
      }),
    getStats: protectedProcedure
      .input(z.object({ listId: z.number() }))
      .query(async ({ ctx, input }) => {
        return await getUserLearningStats(ctx.user.id, input.listId);
      }),
    getRecords: protectedProcedure
      .input(z.object({ listId: z.number() }))
      .query(async ({ ctx, input }) => {
        return await getUserLearningRecords(ctx.user.id, input.listId);
      }),
    uploadPdf: protectedProcedure
      .input(
        z.object({
          listId: z.number(),
          pdfBase64: z.string(),
        })
      )
      .mutation(async ({ input }) => {
        const pdfBuffer = Buffer.from(input.pdfBase64, 'base64');
        const items = await parsePdfVocabulary(pdfBuffer);
        if (items.length === 0) {
          throw new Error("No vocabulary items found in PDF");
        }
        return await addVocabularyItems(input.listId, items);
      }),
  }),
});

export type AppRouter = typeof appRouter;
