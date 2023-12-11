import { json, type LoaderFunctionArgs } from "@remix-run/node";

const baseUrl = "https://quote-api.jup.ag/v6/quote";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const url = new URL(request.url);
  const queryString = url.searchParams.toString();
  const response = await fetch(`${baseUrl}?${queryString}`);
  const data = await response.json();

  return json(data);
};
