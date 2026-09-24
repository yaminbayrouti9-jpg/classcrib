"use client";

import { useEffect } from "react";

const replacements: Array<[string, string]> = [
  [
    "Join thousands of students and teachers who are standardizing productivity and mastering financial decisions daily.",
    "Join our pilot community of students and teachers as we test and improve ClassCrib together.",
  ],
  [
    "My student completes his algebra work first thing Monday morning just to buy the Gaming Rig desk upgrade for his crib.",
    "Pilot feedback will be shared as it becomes available.",
  ],
  ["— Sarah M., Parent", "Pilot feedback (no public testimonial yet)"],
  ["Is ClassCrib COPPA compliant and secure?", "How does ClassCrib approach privacy and security in the UAE?"],
  ["Privacy & COPPA", "Privacy & UAE PDPL"],
  ["SECUREED TECH", "SECURED TECH"],
  ["support@classcrib.com", "support@classcrib.ae"],
];

function correctVisibleCopy() {
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  const nodes: Text[] = [];
  let node: Node | null;

  while ((node = walker.nextNode())) {
    nodes.push(node as Text);
  }

  nodes.forEach((textNode) => {
    let value = textNode.nodeValue ?? "";
    replacements.forEach(([from, to]) => {
      value = value.split(from).join(to);
    });
    if (value !== textNode.nodeValue) {
      textNode.nodeValue = value;
    }
  });
}

export default function ContentCorrections() {
  useEffect(() => {
    correctVisibleCopy();
    const observer = new MutationObserver(correctVisibleCopy);
    observer.observe(document.body, { childList: true, subtree: true, characterData: true });
    return () => observer.disconnect();
  }, []);

  return null;
}
