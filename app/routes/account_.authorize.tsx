import { json, LoaderFunctionArgs, redirect } from "@remix-run/node";
import { commitSession, getSession } from "~/sessions";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");

  const session = await getSession(request.headers.get("Cookie"));

  const codeVerifier = session.get("codeVerifier");

  const clientId = process.env.PUBLIC_CUSTOMER_ACCOUNT_API_CLIENT_ID;
  const clientSecret = process.env.PRIVATE_CUSTOMER_ACCOUNT_CLIENT_SECRET;

  const credentials = btoa(`${clientId}:${clientSecret}`);

  const params = {
    client_id: clientId,
    code,
    code_verifier: codeVerifier,
    grant_type: "authorization_code",
    redirect_uri: `${process.env.DOMAIN}/account/authorize`,
  };

  const body = Object.keys(params)
    .map(
      (key) => encodeURIComponent(key) + "=" + encodeURIComponent(params[key]!)
    )
    .join("&");

  const res = await fetch(
    `${process.env.PUBLIC_CUSTOMER_ACCOUNT_API_URL}/auth/oauth/token`,
    {
      body,
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${credentials}`,
      },
      method: "POST",
    }
  );

  const {
    access_token,
    refresh_token,
    token_type,
    expires_in,
    scope,
    id_token: idToken,
  } = await res.json();

  const newParams = {
    grant_type: "urn:ietf:params:oauth:grant-type:token-exchange",
    client_id: clientId,
    audience: "30243aa5-17c1-465a-8493-944bcc4e88aa",
    subject_token: access_token,
    subject_token_type: "urn:ietf:params:oauth:token-type:access_token",
    scopes: "https://api.customers.com/auth/customer.graphql",
  };

  const newBody = Object.keys(newParams)
    .map(
      (key) =>
        encodeURIComponent(key) + "=" + encodeURIComponent(newParams[key]!)
    )
    .join("&");

  const response = await fetch(
    `${process.env.PUBLIC_CUSTOMER_ACCOUNT_API_URL}/auth/oauth/token`,
    {
      body: newBody,
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${credentials}`,
      },
      method: "POST",
    }
  );

  const { access_token: accessToken } = await response.json();

  session.set("accessToken", accessToken);
  session.set("idToken", idToken);

  return redirect("/account", {
    headers: {
      "Set-Cookie": await commitSession(session),
    },
  });
};
