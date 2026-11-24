import assert from "node:assert/strict";
import { it } from "node:test";
import {
  handleTelegramAdminCallback,
  handleTelegramAdminMessage,
  type TelegramAdminDependencies,
} from "../src/lib/server/telegram-admin";

it("rejects admin menu callbacks from unauthorized users", async () => {
  const apiCalls: { method: string; payload: Record<string, unknown> }[] = [];
  const messages: string[] = [];
  const dependencies: TelegramAdminDependencies = {
    sendMessage: async (text) => {
      messages.push(text);
      return { ok: true };
    },
    callApi: async (method, payload) => {
      apiCalls.push({ method, payload });
      return { ok: true };
    },
    isAdmin: () => false,
  };

  const handled = await handleTelegramAdminCallback(
    {
      id: "callback-id",
      from: { id: 123, first_name: "Guest" },
      message: { message_id: 1, chat: { id: 123, type: "private" } },
      data: "admin_main",
    },
    dependencies,
  );

  assert.equal(handled, true);
  assert.deepEqual(messages, []);
  assert.deepEqual(apiCalls, [{
    method: "answerCallbackQuery",
    payload: {
      callback_query_id: "callback-id",
      text: "Only an authorized hotel admin can use this action.",
      show_alert: true,
    },
  }]);
});

it("denies the admin command to unauthorized users", async () => {
  const messages: string[] = [];
  const dependencies: TelegramAdminDependencies = {
    sendMessage: async (text) => {
      messages.push(text);
      return { ok: true };
    },
    callApi: async () => ({ ok: true }),
    isAdmin: () => false,
  };

  const handled = await handleTelegramAdminMessage(
    {
      message_id: 1,
      from: { id: 123 },
      chat: { id: 123, type: "private" },
      text: "/admin",
    },
    dependencies,
  );

  assert.equal(handled, true);
  assert.deepEqual(messages, ["⛔ Admin access is restricted to authorized hotel staff."]);
});
