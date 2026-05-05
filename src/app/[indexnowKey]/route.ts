import { notFound } from "next/navigation";

type RouteParams = {
  params: {
    indexnowKey: string;
  };
};

export function GET(_request: Request, { params }: RouteParams) {
  const key = process.env.INDEXNOW_KEY?.trim();

  if (!key || params.indexnowKey !== `${key}.txt`) {
    notFound();
  }

  return new Response(key, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=86400",
    },
  });
}
