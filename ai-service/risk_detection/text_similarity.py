from typing import List, Dict, Any, Tuple
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import re

class TextSimilarityDetector:
    """
    Computes TF-IDF vectorization and cosine similarity between campaign descriptions
    to detect duplicate campaigns, plagiarized stories, or repetitive submissions.
    """

    def __init__(self):
        self.vectorizer = TfidfVectorizer(
            stop_words='english',
            ngram_range=(1, 2),
            max_features=5000,
            token_pattern=r'(?u)\b\w\w+\b'
        )

    def find_similar_campaigns(
        self,
        current_description: str,
        current_title: str,
        existing_campaigns: List[Dict[str, Any]],
        threshold: float = 0.45
    ) -> List[Dict[str, Any]]:
        """
        Calculates cosine similarity between the current campaign and all existing campaigns.
        Returns a list of matching campaigns sorted by similarity score.
        """
        if not existing_campaigns or not current_description.strip():
            return []

        # Combine title and description for richer semantic matching
        current_full_text = f"{current_title} {current_description}".strip()
        corpus = [current_full_text]
        campaign_meta = []

        for camp in existing_campaigns:
            camp_title = camp.get('title', '')
            camp_desc = camp.get('description', '')
            text = f"{camp_title} {camp_desc}".strip()
            if text:
                corpus.append(text)
                campaign_meta.append(camp)

        if len(corpus) <= 1:
            return []

        try:
            tfidf_matrix = self.vectorizer.fit_transform(corpus)
            # cosine similarity of first item (current) against all others
            cosine_similarities = cosine_similarity(tfidf_matrix[0:1], tfidf_matrix[1:])[0]

            matches = []
            for idx, score in enumerate(cosine_similarities):
                float_score = float(score)
                if float_score >= threshold:
                    camp = campaign_meta[idx]
                    matches.append({
                        "campaign_id": str(camp.get("id", "")),
                        "title": camp.get("title", "Untitled Campaign"),
                        "similarity_score": round(float_score, 4),
                        "similarity_percentage": f"{round(float_score * 100, 1)}%"
                    })

            # Sort descending by similarity score
            matches.sort(key=lambda x: x["similarity_score"], reverse=True)
            return matches

        except Exception as e:
            # Fallback simple Jaccard word-overlap similarity if TF-IDF fails on edge cases
            matches = []
            current_words = set(re.findall(r'\w+', current_full_text.lower()))
            for camp in campaign_meta:
                text = f"{camp.get('title', '')} {camp.get('description', '')}".lower()
                c_words = set(re.findall(r'\w+', text))
                if current_words and c_words:
                    jaccard = len(current_words.intersection(c_words)) / len(current_words.union(c_words))
                    if jaccard >= threshold:
                        matches.append({
                            "campaign_id": str(camp.get("id", "")),
                            "title": camp.get("title", ""),
                            "similarity_score": round(jaccard, 4),
                            "similarity_percentage": f"{round(jaccard * 100, 1)}%"
                        })
            matches.sort(key=lambda x: x["similarity_score"], reverse=True)
            return matches
