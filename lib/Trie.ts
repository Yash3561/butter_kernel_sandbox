// lib/Trie.ts

export interface KeyCoordinate {
  char: string;
  x: number;
  y: number;
}

export interface TapEvent {
  x: number;
  y: number;
  timestamp: number;
}

export interface Candidate {
  word: string;
  prefixMatch: string;
  spatialScore: number;
  frequency: number;
  finalRank: number;
}

class TrieNode {
  children: Map<string, TrieNode>;
  isEndOfWord: boolean;
  frequency: number;

  constructor() {
    this.children = new Map();
    this.isEndOfWord = false;
    this.frequency = 0;
  }
}

export class Trie {
  root: TrieNode;

  // Dictionary with common words
  private dictionary = [
    // Highest priority - greeting/conversational
    "hello", "hi", "hey", "thanks", "thank", "please", "sorry", "okay", "yes", "no",
    "bye", "goodbye", "welcome", "help", "great", "good", "nice", "cool", "awesome",

    // Common words
    "the", "be", "to", "of", "and", "a", "in", "that", "have", "i",
    "it", "for", "not", "on", "with", "he", "as", "you", "do", "at",
    "this", "but", "his", "by", "from", "they", "we", "say", "her", "she",
    "or", "an", "will", "my", "one", "all", "would", "there", "their", "what",
    "so", "up", "out", "if", "about", "who", "get", "which", "go", "me",
    "when", "make", "can", "like", "time", "no", "just", "him", "know", "take",
    "people", "into", "year", "your", "good", "some", "could", "them", "see", "other",
    "than", "then", "now", "look", "only", "come", "its", "over", "think", "also",
    "back", "after", "use", "two", "how", "our", "work", "first", "well", "way",
    "even", "new", "want", "because", "any", "these", "give", "day", "most", "us",

    // Common verbs
    "ask", "need", "feel", "become", "leave", "put", "mean", "keep", "let", "begin",
    "seem", "show", "hear", "play", "run", "move", "live", "believe", "hold",
    "bring", "happen", "write", "provide", "sit", "stand", "lose", "pay", "meet", "include",
    "continue", "set", "learn", "change", "lead", "understand", "watch", "follow", "stop", "create",
    "speak", "read", "allow", "add", "spend", "grow", "open", "walk", "win", "offer",
    "remember", "love", "consider", "appear", "buy", "wait", "serve", "die", "send", "expect",
    "build", "stay", "fall", "cut", "reach", "kill", "remain", "suggest", "raise", "pass",
    "sell", "require", "report", "decide", "pull", "develop", "carry", "break", "receive",
    "agree", "support", "hit", "produce", "eat", "cover", "catch", "draw", "choose", "check",

    // Nouns
    "man", "woman", "child", "world", "life", "hand", "part", "place", "case", "week",
    "company", "system", "program", "question", "government", "number", "night", "point", "home",
    "water", "room", "mother", "area", "money", "story", "fact", "month", "lot", "right",
    "study", "book", "eye", "job", "word", "business", "issue", "side", "kind", "head",
    "house", "service", "friend", "father", "power", "hour", "game", "line", "end", "member",
    "law", "car", "city", "community", "name", "president", "team", "minute", "idea", "kid",
    "body", "information", "school", "family", "student", "group", "country", "problem", "thing", "party",
    "result", "morning", "reason", "research", "girl", "guy", "moment", "air", "teacher",
    "force", "education", "food", "door", "history", "today", "yesterday", "tomorrow", "tonight", "meeting",

    // Tech words
    "app", "phone", "email", "text", "message", "call", "video", "photo", "camera", "screen",
    "computer", "internet", "website", "online", "password", "account", "profile", "post", "share",
    "comment", "upload", "download", "file", "data", "cloud", "network", "software", "hardware", "device",
    "keyboard", "mouse", "click", "type", "search", "google", "facebook", "twitter", "instagram", "youtube",

    // Time
    "later", "soon", "always", "never", "sometimes", "often", "usually", "recently", "afternoon", "evening",
    "second", "daily", "weekly", "monthly", "yearly", "annual", "forever", "instant",

    // Places
    "apartment", "office", "university", "college", "hospital", "store", "shop",
    "restaurant", "hotel", "airport", "station", "park", "beach", "mountain", "town",
    "street", "road", "building", "kitchen", "bedroom", "bathroom", "garden", "garage", "bank",

    // Food
    "coffee", "tea", "juice", "milk", "beer", "wine", "bread", "rice",
    "meat", "chicken", "fish", "pizza", "burger", "sandwich", "salad", "soup", "fruit", "vegetable",
    "apple", "orange", "banana", "breakfast", "lunch", "dinner", "snack", "meal", "dessert", "chocolate",

    // Feelings
    "happy", "sad", "angry", "excited", "nervous", "worried", "scared", "tired", "bored", "confused",
    "surprised", "disappointed", "frustrated", "proud", "embarrassed", "lonely", "loved", "grateful", "hopeful", "anxious",

    // More words
    "going", "coming", "looking", "getting", "making", "taking", "giving", "saying", "trying", "asking",
    "telling", "thinking", "feeling", "wanting", "needing", "having", "being", "doing", "working", "playing",
    "checking", "sending", "calling", "texting", "emailing", "waiting", "starting", "finishing", "helping",

    // Common extras
    "are", "am", "is", "was", "were", "been", "being", "has", "had", "having",
    "does", "did", "doing", "should", "must", "might", "may", "shall", "ought",
    "here", "there", "where", "everywhere", "somewhere", "nowhere", "anywhere"
  ];

  constructor() {
    this.root = new TrieNode();
    this.initializeDictionary();
  }

  private initializeDictionary() {
    for (let i = 0; i < this.dictionary.length; i++) {
      const word = this.dictionary[i];
      // Higher frequency for earlier words
      const frequency = 100 - (i * 0.08);
      this.insert(word, Math.max(frequency, 1));
    }
  }

  insert(word: string, frequency: number = 1) {
    let node = this.root;
    for (const char of word.toLowerCase()) {
      if (!node.children.has(char)) {
        node.children.set(char, new TrieNode());
      }
      node = node.children.get(char)!;
    }
    node.isEndOfWord = true;
    node.frequency = frequency;
  }

  // Simple prefix search - returns words starting with prefix
  searchPrefix(prefix: string): { word: string, frequency: number }[] {
    let node = this.root;
    for (const char of prefix.toLowerCase()) {
      if (!node.children.has(char)) {
        return [];
      }
      node = node.children.get(char)!;
    }
    return this.collectWords(node, prefix.toLowerCase());
  }

  private collectWords(node: TrieNode, prefix: string): { word: string, frequency: number }[] {
    let words: { word: string, frequency: number }[] = [];
    if (node.isEndOfWord) {
      words.push({ word: prefix, frequency: node.frequency });
    }
    for (const [char, childNode] of node.children) {
      words = words.concat(this.collectWords(childNode, prefix + char));
    }
    return words;
  }

  /**
   * FIXED: Spatial Weighting that actually respects what the user typed
   * 
   * Strategy:
   * 1. First, find the CLOSEST key to each tap (what user most likely intended)
   * 2. Build the "typed prefix" from closest keys
   * 3. Search for words matching that prefix
   * 4. ALSO check nearby keys for typo tolerance (spatial candidates)
   * 5. Rank by: prefix match quality > frequency > spatial distance
   */
  searchWithSpatialWeighting(
    taps: TapEvent[],
    keyMap: KeyCoordinate[]
  ): Candidate[] {
    if (taps.length === 0 || keyMap.length === 0) {
      return [];
    }

    // Step 1: Determine the most likely typed string (closest key for each tap)
    const typedChars: string[] = [];
    for (const tap of taps) {
      const closest = this.getClosestKey(tap, keyMap);
      typedChars.push(closest);
    }
    const typedPrefix = typedChars.join('');

    // Step 2: Get exact prefix matches (highest priority)
    const exactMatches = this.searchPrefix(typedPrefix);

    // Step 3: Generate alternative prefixes (for typo tolerance)
    // Only swap one character at a time
    const alternativePrefixes: string[] = [];
    for (let i = 0; i < taps.length; i++) {
      const nearbyKeys = this.getNearbyKeys(taps[i], keyMap, 50);
      for (const nearKey of nearbyKeys) {
        if (nearKey.char !== typedChars[i]) {
          const altPrefix = typedChars.slice(0, i).join('') + nearKey.char + typedChars.slice(i + 1).join('');
          alternativePrefixes.push(altPrefix);
        }
      }
    }

    // Step 4: Build candidates
    const candidates: Candidate[] = [];
    const seenWords = new Set<string>();

    // Add exact matches first (higher score)
    for (const match of exactMatches) {
      if (!seenWords.has(match.word)) {
        seenWords.add(match.word);
        // Exact match bonus
        const prefixMatchRatio = typedPrefix.length / match.word.length;
        const finalRank = match.frequency + (prefixMatchRatio * 50) + 100; // +100 for exact match
        candidates.push({
          word: match.word,
          prefixMatch: typedPrefix,
          spatialScore: prefixMatchRatio,
          frequency: match.frequency,
          finalRank: finalRank
        });
      }
    }

    // Add alternative matches (lower score, for typo tolerance)
    for (const altPrefix of alternativePrefixes) {
      const altMatches = this.searchPrefix(altPrefix);
      for (const match of altMatches.slice(0, 3)) { // Limit alternatives
        if (!seenWords.has(match.word)) {
          seenWords.add(match.word);
          const prefixMatchRatio = altPrefix.length / match.word.length;
          // Lower score for alternatives (no +100 bonus)
          const finalRank = match.frequency + (prefixMatchRatio * 30);
          candidates.push({
            word: match.word,
            prefixMatch: altPrefix,
            spatialScore: prefixMatchRatio * 0.8,
            frequency: match.frequency,
            finalRank: finalRank
          });
        }
      }
    }

    // Sort by final rank
    candidates.sort((a, b) => b.finalRank - a.finalRank);

    return candidates.slice(0, 5);
  }

  // Get the single closest key to a tap
  private getClosestKey(tap: TapEvent, keyMap: KeyCoordinate[]): string {
    let minDist = Infinity;
    let closestChar = 'a';

    for (const key of keyMap) {
      const dist = Math.sqrt(Math.pow(tap.x - key.x, 2) + Math.pow(tap.y - key.y, 2));
      if (dist < minDist) {
        minDist = dist;
        closestChar = key.char;
      }
    }

    return closestChar;
  }

  // Get nearby keys within radius (for typo tolerance)
  private getNearbyKeys(tap: TapEvent, keyMap: KeyCoordinate[], radius: number): { char: string, distance: number }[] {
    const nearby: { char: string, distance: number }[] = [];

    for (const key of keyMap) {
      const dist = Math.sqrt(Math.pow(tap.x - key.x, 2) + Math.pow(tap.y - key.y, 2));
      if (dist < radius) {
        nearby.push({ char: key.char, distance: dist });
      }
    }

    nearby.sort((a, b) => a.distance - b.distance);
    return nearby.slice(0, 3); // Top 3 closest
  }

  getFrequency(word: string): number {
    let node = this.root;
    for (const char of word.toLowerCase()) {
      if (!node.children.has(char)) return 0;
      node = node.children.get(char)!;
    }
    return node.isEndOfWord ? node.frequency : 0;
  }
}
