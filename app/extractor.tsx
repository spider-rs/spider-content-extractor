"use client";

import { useState } from "react";
import SearchBar from "./searchbar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface ExtractedData {
  url: string;
  title: string;
  description: string;
  headings: { level: number; text: string }[];
  images: { src: string; alt: string }[];
  links: { href: string; text: string; external: boolean }[];
  wordCount: number;
  readingTime: string;
}

function extractFromHTML(url: string, html: string): ExtractedData {
  const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i);
  const descMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']*)["']/i);
  const headings: ExtractedData["headings"] = [];
  const hRegex = /<h([1-6])[^>]*>([\s\S]*?)<\/h\1>/gi;
  let m;
  while ((m = hRegex.exec(html)) !== null) headings.push({ level: parseInt(m[1]), text: m[2].replace(/<[^>]+>/g, "").trim() });
  const images: ExtractedData["images"] = [];
  const imgRegex = /<img[^>]*src=["']([^"']*)["'][^>]*(?:alt=["']([^"']*)["'])?/gi;
  while ((m = imgRegex.exec(html)) !== null) images.push({ src: m[1], alt: m[2] || "" });
  const links: ExtractedData["links"] = [];
  const aRegex = /<a[^>]*href=["']([^"']*)["'][^>]*>([\s\S]*?)<\/a>/gi;
  let baseDomain = "";
  try { baseDomain = new URL(url).hostname; } catch {}
  while ((m = aRegex.exec(html)) !== null) {
    const href = m[1];
    const text = m[2].replace(/<[^>]+>/g, "").trim();
    let external = false;
    try { external = !new URL(href, url).hostname.includes(baseDomain); } catch {}
    links.push({ href, text, external });
  }
  const textContent = html.replace(/<script[\s\S]*?<\/script>/gi, "").replace(/<style[\s\S]*?<\/style>/gi, "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  const wordCount = textContent.split(/\s+/).length;
  return {
    url, title: titleMatch?.[1]?.trim() || "", description: descMatch?.[1] || "",
    headings, images, links, wordCount, readingTime: `${Math.ceil(wordCount / 200)} min`,
  };
}

export default function Extractor() {
  const [data, setData] = useState<any[] | null>(null);
  const [tab, setTab] = useState<"text" | "headings" | "images" | "links">("text");
  const [selectedIdx, setSelectedIdx] = useState(0);

  const extracted = (data || []).filter((p) => p?.url && p?.content).map((p) => extractFromHTML(p.url, p.content));
  const current = extracted[selectedIdx];

  const downloadJSON = () => {
    const blob = new Blob([JSON.stringify(extracted, null, 2)], { type: "application/json" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "extracted.json"; a.click();
  };

  return (
    <div className="flex flex-col h-screen">
      <SearchBar setDataValues={setData} />
      <div className="flex-1 overflow-auto p-4">
        {extracted.length > 0 && current && (
          <>
            <div className="flex items-center justify-between mb-4">
              <div className="flex gap-4">
                <span className="text-sm">{extracted.length} pages</span>
                <span className="text-sm">{extracted.reduce((s, e) => s + e.wordCount, 0)} words total</span>
              </div>
              <Button size="sm" onClick={downloadJSON}>Download JSON</Button>
            </div>
            {extracted.length > 1 && (
              <select className="mb-4 bg-background border rounded p-2 text-sm w-full" value={selectedIdx} onChange={(e) => setSelectedIdx(Number(e.target.value))}>
                {extracted.map((e, i) => <option key={i} value={i}>{e.url}</option>)}
              </select>
            )}
            <div className="flex gap-2 mb-4">
              {(["text", "headings", "images", "links"] as const).map((t) => (
                <Button key={t} size="sm" variant={tab === t ? "default" : "outline"} onClick={() => setTab(t)} className="capitalize">{t}</Button>
              ))}
            </div>
            <div className="border rounded-lg p-4 overflow-auto max-h-[calc(100vh-300px)]">
              {tab === "text" && (
                <div>
                  <h3 className="font-bold mb-2">{current.title || "Untitled"}</h3>
                  <p className="text-sm text-muted-foreground mb-2">{current.description}</p>
                  <div className="flex gap-4 text-xs text-muted-foreground mb-4">
                    <span>{current.wordCount} words</span>
                    <span>{current.readingTime} read</span>
                  </div>
                </div>
              )}
              {tab === "headings" && current.headings.map((h, i) => (
                <div key={i} className="py-1 text-sm" style={{ paddingLeft: (h.level - 1) * 16 }}>
                  <Badge variant="outline" className="mr-2 text-xs">H{h.level}</Badge>{h.text}
                </div>
              ))}
              {tab === "images" && (
                <div className="grid grid-cols-2 gap-3">
                  {current.images.map((img, i) => (
                    <div key={i} className="border rounded p-2 text-xs">
                      <p className="truncate text-primary">{img.src}</p>
                      <p className="text-muted-foreground">{img.alt || "No alt text"}</p>
                    </div>
                  ))}
                </div>
              )}
              {tab === "links" && (
                <table className="w-full text-sm">
                  <thead><tr><th className="text-left p-2">URL</th><th className="text-left p-2">Text</th><th className="p-2">Type</th></tr></thead>
                  <tbody>
                    {current.links.slice(0, 100).map((link, i) => (
                      <tr key={i} className="border-t">
                        <td className="p-2 truncate max-w-xs">{link.href}</td>
                        <td className="p-2 truncate max-w-xs">{link.text}</td>
                        <td className="p-2"><Badge variant={link.external ? "secondary" : "outline"} className="text-xs">{link.external ? "external" : "internal"}</Badge></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </>
        )}
        {!data && <div className="flex items-center justify-center h-full text-muted-foreground">Enter a URL to extract content</div>}
      </div>
    </div>
  );
}
