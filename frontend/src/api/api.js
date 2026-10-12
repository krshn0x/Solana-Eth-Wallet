export async function getBalance(chain, address, network, signal) {
  const response = await fetch(
    `/api/balance/${chain}/${encodeURIComponent(address)}?network=${network}`,
    { signal },
  );
  const data = await response.json().catch(() => {
    throw new Error("Balance service returned an invalid response.");
  });
  if (!response.ok)
    throw new Error(data.error || "Balance service is unavailable.");
  return data;
}
