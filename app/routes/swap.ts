import { json, type ActionFunctionArgs } from "@remix-run/node";

export const action = async ({ request }: ActionFunctionArgs) => {
  const body = await request.json();

  const response = await fetch("https://quote-api.jup.ag/v6/swap", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  });

  const data = await response.json();

  return json(data);
};
