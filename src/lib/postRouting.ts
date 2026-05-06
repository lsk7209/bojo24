const UUID_PATTERN =
  /^(?<slug>.+)-(?<id>[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})$/i;
const HEX_ID_PATTERN = /^(?<slug>.+)-(?<id>[0-9a-f]{32})$/i;

type PostRouteSource = {
  id: string;
  slug: string;
};

export const buildPostRouteSlug = (post: PostRouteSource) => `${post.slug}-${post.id}`;

export const buildPostPath = (post: PostRouteSource) => `/blog/${buildPostRouteSlug(post)}`;

export const parsePostRouteSlug = (routeSlug: string) => {
  const match = routeSlug.match(UUID_PATTERN) ?? routeSlug.match(HEX_ID_PATTERN);

  if (!match?.groups) {
    return { slug: routeSlug, id: null };
  }

  return {
    slug: match.groups.slug,
    id: match.groups.id,
  };
};
