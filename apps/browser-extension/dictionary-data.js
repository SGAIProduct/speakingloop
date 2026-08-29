(() => {
  const entries = {
    ai: ["人工智能", "/ˌeɪ ˈaɪ/", "noun"],
    business: ["商业；业务", "/ˈbɪznəs/", "noun"],
    company: ["公司", "/ˈkʌmpəni/", "noun"],
    context: ["上下文；语境", "/ˈkɒntekst/", "noun"],
    deal: ["处理；应对", "/diːl/", "verb"],
    decision: ["决定；决策", "/dɪˈsɪʒən/", "noun"],
    deploy: ["部署；投放", "/dɪˈplɔɪ/", "verb"],
    email: ["电子邮件", "/ˈiːmeɪl/", "noun"],
    expression: ["表达；短语", "/ɪkˈspreʃən/", "noun"],
    good: ["好的；良好的", "/ɡʊd/", "adjective"],
    issue: ["问题；议题", "/ˈɪʃuː/", "noun"],
    latency: ["延迟", "/ˈleɪtənsi/", "noun"],
    likely: ["很可能；可能的", "/ˈlaɪkli/", "adverb / adjective"],
    model: ["模型", "/ˈmɒdəl/", "noun"],
    moment: ["时刻；瞬间", "/ˈməʊmənt/", "noun"],
    present: ["提出；呈现", "/prɪˈzent/", "verb"],
    probably: ["很可能；大概", "/ˈprɒbəbli/", "adverb"],
    product: ["产品", "/ˈprɒdʌkt/", "noun"],
    prompt: ["提示词；促使", "/prɒmpt/", "noun / verb"],
    relativity: ["相对论；相对性", "/ˌreləˈtɪvəti/", "noun"],
    reliable: ["可靠的", "/rɪˈlaɪəbəl/", "adjective"],
    reliably: ["可靠地", "/rɪˈlaɪəbli/", "adverb"],
    save: ["保存；收藏", "/seɪv/", "verb"],
    service: ["服务", "/ˈsɜːrvɪs/", "noun"],
    sleep: ["睡觉；睡眠", "/sliːp/", "verb / noun"],
    special: ["特殊的；特别的", "/ˈspeʃəl/", "adjective"],
    spam: ["垃圾邮件", "/spæm/", "noun"],
    speak: ["说话；表达", "/spiːk/", "verb"],
    transcript: ["文字记录；字幕文本", "/ˈtrænskrɪpt/", "noun"],
    underestimate: ["低估", "/ˌʌndərˈestɪmeɪt/", "verb"],
    user: ["用户", "/ˈjuːzər/", "noun"],
    video: ["视频", "/ˈvɪdiəʊ/", "noun"],
    way: ["方式；道路", "/weɪ/", "noun"],
    word: ["单词；措辞", "/wɜːrd/", "noun"],
    work: ["工作；起作用", "/wɜːrk/", "noun / verb"],
  };
  const irregular = {
    am: "be",
    are: "be",
    been: "be",
    is: "be",
    was: "be",
    were: "be",
    slept: "sleep",
  };

  function normalize(value) {
    return String(value || "").toLowerCase().replace(/^[^a-z]+|[^a-z]+$/g, "");
  }

  function lemma(value) {
    const word = normalize(value);
    if (!word) return "";
    if (irregular[word]) return irregular[word];
    if (entries[word]) return word;
    if (word.endsWith("ies") && word.length > 4) return `${word.slice(0, -3)}y`;
    if (word.endsWith("ing") && word.length > 5) {
      const stem = word.slice(0, -3).replace(/([b-df-hj-np-tv-z])\1$/, "$1");
      if (entries[stem]) return stem;
      if (entries[`${stem}e`]) return `${stem}e`;
      return stem;
    }
    if (word.endsWith("ed") && word.length > 4) {
      const stem = word.slice(0, -2).replace(/([b-df-hj-np-tv-z])\1$/, "$1");
      if (entries[stem]) return stem;
      if (entries[`${stem}e`]) return `${stem}e`;
      return stem;
    }
    if (word.endsWith("s") && !word.endsWith("ss") && word.length > 3) {
      const stem = word.slice(0, -1);
      if (entries[stem]) return stem;
    }
    return word;
  }

  function lookup(value) {
    const key = lemma(value);
    const entry = entries[key];
    if (!entry) return null;
    return {
      lemma: key,
      meaningZh: entry[0],
      pronunciation: entry[1],
      partOfSpeech: entry[2],
      source: "local_dictionary",
    };
  }

  function lookupBatch(values) {
    const result = {};
    for (const value of values || []) {
      const key = lemma(value);
      if (!key || result[key]) continue;
      const entry = lookup(key);
      if (entry) result[key] = entry;
    }
    return result;
  }

  globalThis.SpeakLoopDictionary = Object.freeze({ lemma, lookup, lookupBatch });
})();
