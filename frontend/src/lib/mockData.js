export const demoData = {
  risk_score: 82,
  pii_tokenized: true,
  token_count: 3,
  summary: {
    contract_type: "Freelance Service Agreement",
    parties: ["Rahul Sharma (Dev)", "Global Apex Solutions LLC"],
    duration: "Project Based"
  },
  risk_flags: [
    {
      law: "The Indian Contract Act, 1872",
      section: "Section 27",
      title: "Illegal Restraint of Trade",
      risk_level: "High",
      text: "Developer shall not engage in any consulting activity that competes with the Client for 5 years anywhere in India.",
      explanation: "Extreme Risk. Under Section 27, any agreement that restrains anyone from exercising a lawful profession is void. This 5-year nationwide ban is totally unenforceable."
    },
    {
      law: "Jurisdiction Guardrail",
      section: "Foreign Law Block",
      title: "Non-Indian Jurisdiction Detected",
      risk_level: "High",
      text: "This Agreement shall be governed by the laws of the State of Delaware, USA.",
      explanation: "Warning! The platform detected a foreign jurisdiction. This agreement is not grounded in Indian law, which may lead to significant legal costs and lack of protection."
    },
    {
      law: "The Copyright Act, 1957",
      section: "Section 19",
      title: "High IP Assignment Risk",
      risk_level: "Medium",
      text: "Developer waives all moral rights and shall not be entitled to any further payment or royalty.",
      explanation: "Under Indian law, an assignment of copyright is not valid unless it specifies the amount of royalty payable. This clause is highly unfavorable to the developer."
    }
  ],
  deviations: [
    {
      category: "Jurisdiction",
      severity: "High",
      actual: "Delaware, USA",
      fair_baseline: "Indian Courts (Bangalore/Mumbai)",
      recommendation: "Change jurisdiction to Indian courts to ensure protection under the Indian Contract Act."
    }
  ],
  deviation_count: 2
};
