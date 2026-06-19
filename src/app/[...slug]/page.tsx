import type { Metadata } from "next";
import { DocPageView, docMetadata } from "@/lib/doc-page";
import { getPages } from "@/lib/source";

interface Props {
  params: Promise<{ slug: string[] }>;
}

export default async function Page({ params }: Props) {
  const { slug } = await params;
  return <DocPageView slug={slug} />;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  return docMetadata(slug);
}

export function generateStaticParams(): Array<{ slug: string[] }> {
  return getPages()
    .filter((page) => page.slugs.length > 0)
    .map((page) => ({ slug: page.slugs }));
}
