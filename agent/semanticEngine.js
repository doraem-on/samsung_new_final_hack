import { saveEmbedding } from "../storage/vectorStore.js";

export async function indexPage(text, embedder) {
  const vector = await embedder(text);
  await saveEmbedding(location.href, vector);
  return vector;
}
