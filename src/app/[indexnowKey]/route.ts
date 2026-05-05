import { notFound } from "next/navigation";

type RouteParams = {
  params: Promise<{
    indexnowKey: string;
  }>;
};

export async function GET(_request: Request, { params }: RouteParams) {
  const key = process.env.INDEXNOW_KEY?.trim();
  const { indexnowKey } = await params;

  if (!key || indexnowKey !== `${key}.txt`) {
    notFound();
  }

  return new Response(key, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=86400",
    },
  });
}
