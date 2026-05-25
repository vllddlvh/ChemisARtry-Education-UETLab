export async function translateToVietnamese(text: string): Promise<string> {
  if (!text) return text;
  
  // Basic heuristic to skip translation if it's already in Vietnamese
  // checking for common Vietnamese diacritics
  if (/[àáãạảăắằẳẵặâấầẩẫậèéẹẻẽêềếểễệìíĩỉịòóõọỏôốồổỗộơớờởỡợùúũụủưứừửữựỳýỹỷỵđ]/i.test(text)) {
    return text;
  }

  try {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=vi&dt=t&q=${encodeURIComponent(text)}`;
    const res = await fetch(url);
    if (!res.ok) return text;
    const json = await res.json();
    if (json && Array.isArray(json[0])) {
      return json[0].map((segment: any) => segment[0]).join('');
    }
    return text;
  } catch (e) {
    return text;
  }
}
