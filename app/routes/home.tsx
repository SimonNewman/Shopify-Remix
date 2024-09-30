import type { LoaderFunctionArgs, MetaFunction } from "@remix-run/node";
import { json, Link, useLoaderData } from "@remix-run/react";
import { getSession } from "~/sessions";

export const meta: MetaFunction = () => {
  return [
    { title: "New Remix App" },
    { name: "description", content: "Welcome to Remix!" },
  ];
};

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const session = await getSession(request.headers.get("Cookie"));

  const accessToken = session.get("accessToken");

  if (!accessToken) {
    return null;
  }

  const res = await fetch(
    `${process.env.PUBLIC_CUSTOMER_ACCOUNT_API_URL}/account/customer/api/2024-07/graphql`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: accessToken,
      },
      body: JSON.stringify({
        operationName: "SomeQuery",
        // Query
        query: `query {
                customer {
                  firstName
                  lastName
                  emailAddress {
                    emailAddress
                  }
                  tattoos: metafield(namespace: "custom", key: "tattoos") {
                    id
                    jsonValue
                  }
                }
              }`,
      }),
    }
  );

  const { data } = await res.json();

  return json(data);
};

const Home = () => {
  const data = useLoaderData<typeof loader>();

  return (
    <>
      <h1>Home</h1>
      {!data && (
        <>
          You are logged out. <Link to="/login">Login</Link>
        </>
      )}
      {data && (
        <>
          <p>
            <Link to="/home">Home</Link>
          </p>
          <p>
            Hi {data.customer.firstName} {data.customer.lastName}
          </p>
          <p>
            <Link to="/logout">Logout</Link>
          </p>
        </>
      )}
    </>
  );
};

export default Home;
