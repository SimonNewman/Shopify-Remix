import { generateCodeChallenge, generateCodeVerifier } from "~/utils/crypto";

import { getSession, commitSession } from "~/sessions";
import { json, redirect, LoaderFunctionArgs } from "@remix-run/node";

async function generateState(): Promise<string> {
  const timestamp = Date.now().toString();
  const randomString = Math.random().toString(36).substring(2);
  return timestamp + randomString;
}

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const verifier = await generateCodeVerifier();
  const challenge = await generateCodeChallenge(verifier);

  const session = await getSession(request.headers.get("Cookie"));

  session.set("codeVerifier", verifier);

  await commitSession(session);

  const state = await generateState();

  return redirect(
    `${process.env.PUBLIC_CUSTOMER_ACCOUNT_API_URL}/auth/oauth/authorize?client_id=${process.env.PUBLIC_CUSTOMER_ACCOUNT_API_CLIENT_ID}&response_type=code&redirect_uri=${process.env.DOMAIN}%2Faccount%2Fauthorize&scope=openid%20email%20https%3A%2F%2Fapi.customers.com%2Fauth%2Fcustomer.graphql&code_challenge_method=S256&state=${state}&code_challenge=${challenge}`,
    {
      headers: {
        "Set-Cookie": await commitSession(session),
      },
    }
  );
};
