import requests
import xml.etree.ElementTree as ET
from datetime import datetime
import random
import re

# Track already seen titles to avoid duplicate pushes
seen_news_titles = set()

def fetch_legal_news(incremental=False):
    """
    Fetches live Indian legal news from multiple sources.
    If incremental=True, only returns news items not seen before.
    """
    global seen_news_titles
    
    # Updated reliable sources that don't block requests as easily
    FEED_SOURCES = [
        "http://www.scconline.com/blog/feed/",
        "https://blog.ipleaders.in/feed/",
        "https://www.legalbites.in/feed/"
    ]
    
    news_list = []
    
    for url in FEED_SOURCES:
        try:
            print(f"📡 Attempting news fetch: {url}")
            # Use headers to look like a browser and avoid 403s
            headers = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'application/rss+xml, application/xml, text/xml'
            }
            response = requests.get(url, timeout=10, headers=headers)
            response.raise_for_status()
            
            # Robust parsing: Strip any leading whitespace or garbage before the XML tag
            try:
                content = response.content.decode('utf-8', errors='ignore').strip()
                # Find the actual start of XML
                if '<?xml' in content:
                    content = content[content.find('<?xml'):]
                elif '<rss' in content:
                   content = content[content.find('<rss'):]
                   
                root = ET.fromstring(content)
            except Exception as parse_err:
                print(f"⚠️ XML Parsing failed for {url}: {parse_err}")
                continue # Move to next source

            items = root.findall('.//item')
            if not items:
                # Some feeds use different tag structures
                items = root.findall('.//{http://purl.org/rss/1.0/}item')
            
            if not items:
                continue
                
            for item in items[:5]:
                title_elem = item.find('title')
                link_elem = item.find('link')
                desc_elem = item.find('description')
                date_elem = item.find('pubDate')
                
                title = title_elem.text if title_elem is not None else ""
                link = link_elem.text if link_elem is not None else ""
                description = desc_elem.text if desc_elem is not None else ""
                pub_date = date_elem.text if date_elem is not None else ""
                
                # Image Extraction Logic
                image_url = None
                
                # 1. Check for enclosure (Standard RSS)
                enclosure = item.find('enclosure')
                if enclosure is not None and enclosure.get('type', '').startswith('image'):
                    image_url = enclosure.get('url')
                
                # 2. Check for media:content (Yahoo Media namespace)
                if not image_url:
                    media_content = item.find('{http://search.yahoo.com/mrss/}content')
                    if media_content is not None:
                        image_url = media_content.get('url')
                
                # 3. Check for media:thumbnail
                if not image_url:
                    media_thumb = item.find('{http://search.yahoo.com/mrss/}thumbnail')
                    if media_thumb is not None:
                        image_url = media_thumb.get('url')

                # 4. Check content:encoded (Common in WordPress)
                if not image_url:
                    content_encoded = item.find('{http://purl.org/rss/1.0/modules/content/}encoded')
                    if content_encoded is not None and content_encoded.text:
                        img_match = re.search(r'<img[^>]+src="([^">]+)"', content_encoded.text)
                        if img_match:
                            image_url = img_match.group(1)

                # 5. Regex fallback: Look for <img> tags in description
                if not image_url and description:
                    img_match = re.search(r'src="([^">]+)"', description)
                    if img_match:
                        image_url = img_match.group(1)

                # 6. Ultra-Aggressive Fallback: Scan the entire RAW ITEM XML for ANY image URL
                if not image_url:
                    raw_item = ET.tostring(item, encoding='unicode')
                    # Look for URLs ending in typical image extensions
                    img_urls = re.findall(r'https?://[^\s\"<>]*?\.(?:jpe?g|png|webp|gif)', raw_item)
                    if img_urls:
                        # Exclude tracking pixels / tiny icons if possible (heuristic > 50 chars)
                        suitable_images = [url for url in img_urls if len(url) > 40 and 'pixel' not in url.lower()]
                        if suitable_images:
                            image_url = suitable_images[0]

                if not title: continue

                # Deep clean summary (remove all HTML and Trim)
                clean_summary = re.sub('<[^<]+?>', '', description)
                clean_summary = clean_summary.replace('&nbsp;', ' ').strip()
                clean_summary = (clean_summary[:140] + "...") if len(clean_summary) > 140 else clean_summary
                
                # Friendly Date
                friendly_date = pub_date[:16] if pub_date else "Recent"

                tags = ["Court News", "Statutory", "Legislation", "Law Update", "Notification"]
                tag = random.choice(tags)
                
                # Intelligent Fallback Images
                if not image_url:
                    if "Court" in tag:
                        image_url = "local:court"
                    elif "Legislation" in tag or "Statutory" in tag:
                        image_url = "local:paper"
                    else:
                        image_url = "local:tech"

                news_item = {
                    "tag": tag,
                    "title": title.strip(),
                    "date": friendly_date,
                    "summary": clean_summary if clean_summary else "Indian legal update and analysis.",
                    "impact": random.choice(["High", "Medium"]),
                    "link": link,
                    "image": image_url
                }

                if incremental:
                    if title not in seen_news_titles:
                        news_list.append(news_item)
                else:
                    news_list.append(news_item)
                
                seen_news_titles.add(title)

            if news_list:
                return news_list
                
        except Exception as e:
            print(f"⚠️ Source {url} failed: {e}")
            continue

    # Final fallback if all else fails
    return news_list if news_list or incremental else _get_fallback_news()

def _get_fallback_news():
    """Fallback in case RSS is unreachable."""
    return [
        {
            "tag": "Amendment",
            "title": "Digital Personal Data Protection Act (DPDP) 2023",
            "date": "Jan 2026",
            "summary": "Strict compliance requirements for data fiduciaries in India. All service contracts must now include specific data processing clauses.",
            "impact": "High",
            "link": "https://www.meity.gov.in/content/digital-personal-data-protection-act-2023"
        },
        {
            "tag": "Supreme Court",
            "title": "Clarification on Arbitration Seat vs Venue",
            "date": "Dec 2025",
            "summary": "New ruling simplifies jurisdiction disputes in commercial contracts. Seat designation now overrides venue for court jurisdiction.",
            "impact": "Medium",
            "link": "https://main.sci.gov.in/"
        },
        {
            "tag": "Policy",
            "title": "Gig Worker Social Security Code",
            "date": "Feb 2026",
            "summary": "New mandates for aggregators to contribute to gig worker welfare funds. Impacts freelancer-client service agreements.",
            "impact": "High",
            "link": "https://labour.gov.in/"
        }
    ]
