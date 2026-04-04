import { pipeline } from "@huggingface/transformers";

const DOCUMENT_PREFIX = "検索文書: ";
const MAX_CHARS = 12_000; // Ruri v3: 8192 tokens ≈ 1万〜1.5万文字、余裕を持って切り詰め

export async function createEmbedder(modelPath: string) {
  const extractor = await pipeline("feature-extraction", modelPath, {
    dtype: "fp32",
  });

  return async function embed(texts: string[]): Promise<Float32Array[]> {
    const prefixed = texts.map((t) => {
      const truncated = t.length > MAX_CHARS ? t.slice(0, MAX_CHARS) : t;
      return DOCUMENT_PREFIX + truncated;
    });

    const output = await extractor(prefixed, {
      pooling: "mean",
      normalize: true,
    });

    const data = output.data as Float32Array;
    const hiddenSize = output.dims[1];

    return texts.map((_, i) =>
      data.slice(i * hiddenSize, (i + 1) * hiddenSize),
    );
  };
}
