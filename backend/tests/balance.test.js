const test = require("node:test");
const assert = require("node:assert/strict");
const { createApp, NETWORKS } = require("../app");
const SOL = "HAgk14JpMQLgt6rVgv7cBQFJWFto5Dqxi472uT3DKpqk";
const ETH = "0x9858EfFD232B4033E47d90003D41EC34EcaEda94";
async function withServer(fetchImpl, run) {
  const server = createApp({ fetchImpl }).listen(0, "127.0.0.1");
  await new Promise((resolve) => server.once("listening", resolve));
  try {
    await run(`http://127.0.0.1:${server.address().port}`);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
}
const response = (result) => ({ ok: true, json: async () => ({ result }) });
test("rejects invalid requests without contacting RPC", async () => {
  await withServer(
    () => {
      throw new Error("must not call RPC");
    },
    async (base) => {
      for (const suffix of [
        "sol/invalid",
        `eth/${ETH}?network=invalid`,
        `unknown/${SOL}`,
        "eth/vitalik.eth",
      ])
        assert.equal(
          (await fetch(`${base}/api/balance/${suffix}`)).status,
          400,
        );
      assert.equal(
        (await fetch(`${base}/api/wallet/generate`, { method: "POST" })).status,
        410,
      );
    },
  );
});
test("native amounts stay exact strings and use selected networks", async () => {
  const calls = [];
  await withServer(
    async (url, options) => {
      const body = JSON.parse(options.body);
      calls.push({ url, ...body });
      return response(
        body.method === "getBalance"
          ? { value: 1234567890 }
          : "0xde0b6b3a7640001",
      );
    },
    async (base) => {
      assert.equal(
        (await (await fetch(`${base}/api/balance/sol/${SOL}`)).json()).balance,
        "1.23456789",
      );
      assert.equal(
        (
          await (
            await fetch(`${base}/api/balance/eth/${ETH}?network=mainnet`)
          ).json()
        ).balance,
        "1.000000000000000001",
      );
      assert.equal(calls[0].url, NETWORKS.testnet.solana);
      assert.equal(calls[1].url, NETWORKS.mainnet.ethereum);
    },
  );
});
test("sums USDC across token accounts and uses the devnet mint", async () => {
  await withServer(
    async (_url, options) => {
      const body = JSON.parse(options.body);
      assert.equal(body.params[1].mint, NETWORKS.testnet.usdc);
      return response({
        value: ["1234567", "2000000"].map((amount) => ({
          account: {
            data: {
              parsed: { info: { tokenAmount: { amount, decimals: 6 } } },
            },
          },
        })),
      });
    },
    async (base) => {
      assert.equal(
        (await (await fetch(`${base}/api/balance/tokens/${SOL}`)).json())
          .balance,
        "3.234567",
      );
    },
  );
});
test("an empty token list is zero; RPC failures are never zero", async () => {
  await withServer(
    async () => response({ value: [] }),
    async (base) =>
      assert.equal(
        (await (await fetch(`${base}/api/balance/tokens/${SOL}`)).json())
          .balance,
        "0.0",
      ),
  );
  await withServer(
    async () => {
      throw new Error("secret upstream failure detail");
    },
    async (base) => {
      const result = await fetch(`${base}/api/balance/tokens/${SOL}`);
      assert.equal(result.status, 502);
      const data = await result.json();
      assert.equal(data.balance, undefined);
      assert.equal(data.error.includes("secret"), false);
    },
  );
});
test("unknown API routes return JSON rather than frontend HTML", async () => {
  await withServer(
    async () => {},
    async (base) => {
      const result = await fetch(`${base}/api/no-such-route`);
      assert.equal(result.status, 404);
      assert.ok((await result.json()).error);
    },
  );
});
