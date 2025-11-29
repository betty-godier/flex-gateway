import Image from "next/image";

async function getHello() {
  const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/hello`);
  if (!res.ok) {
    return { message: "Erreur API", timestamp: "" };
  }
  return res.json();
}

export default async function Home() {
  const data = await getHello();

  return (
    <main style={{ padding: 40, fontFamily: "system-ui" }}>
      <h1>Flex Gateway – MVP</h1>
      <p>Ceci est la première version de ma plateforme de flex.</p>

      <h2>Test API interne</h2>
      <pre>{JSON.stringify(data, null, 2)}</pre>
    </main>
  );
}
