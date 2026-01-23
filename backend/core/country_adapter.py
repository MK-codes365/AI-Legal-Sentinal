from legal_engine.india.contract_act import analyze_clause

class CountryAdapter:
    def __init__(self, country: str):
        self.country = country.lower()

    def analyze(self, clauses):
        if self.country == "india":
            return self._analyze_india(clauses)
        else:
            return []

    def _analyze_india(self, clauses):
        flags = []
        for clause in clauses:
            flags.extend(analyze_clause(clause))
        return flags
