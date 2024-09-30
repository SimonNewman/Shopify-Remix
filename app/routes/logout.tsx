import { LoaderFunctionArgs, redirect } from "@remix-run/node";
import { destroySession, getSession } from "~/sessions";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const session = await getSession(request.headers.get("Cookie"));

  const idToken = session.get("idToken");

  return redirect(
    `${process.env.PUBLIC_CUSTOMER_ACCOUNT_API_URL}/auth/logout?id_token_hint=${idToken}&post_logout_redirect_uri=${process.env.DOMAIN}/account`,
    {
      headers: {
        "Set-Cookie": await destroySession(session),
      },
    }
  );
};
