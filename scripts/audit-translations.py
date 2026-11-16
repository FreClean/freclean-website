#!/usr/bin/env python3
"""Audit translation catalog parity and static HTML coverage."""

import json
import re
import sys
from html.parser import HTMLParser
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
LOCALES = ROOT / "locales"
TARGET_LOCALES = {"ht": "Haitian Creole", "es": "Spanish", "pt": "Brazilian Portuguese"}
SKIP_TAGS = {"script", "style", "noscript"}
TEXT_ATTRIBUTES = {"alt", "aria-label", "placeholder", "title"}
META_CONTENT = {
    ("name", "description"),
    ("property", "og:title"),
    ("property", "og:description"),
    ("property", "og:image:alt"),
    ("name", "twitter:title"),
    ("name", "twitter:description"),
    ("name", "twitter:image:alt"),
}
WORD = re.compile(r"[A-Za-z]{2}")
DYNAMIC_COPY = (
    "Cookie preferences",
    "Your cookie choices",
    "FreClean uses necessary cookies for the site to work. Optional preferences, analytics, and marketing cookies remain off until you choose otherwise.",
    "Necessary",
    "Preferences",
    "Analytics",
    "Marketing",
    "Only necessary cookies",
    "Save preferences",
    "Accept all",
    "Cookie policy",
    "Close navigation menu",
    "Close navigation",
    "Open navigation menu",
    "Menu",
    "Close",
    "Please check the required fields before sending your enquiry.",
    "Online submission is unavailable. Your enquiry has not been sent; draft an email with these details and send it to FreClean.",
    "Please check your name, email and message. Messages must be between 10 and 5,000 characters.",
    "Your enquiry is too large. Please shorten your message and try again.",
    "Sending...",
    "Sending your enquiry...",
    "Your enquiry was received. FreClean will confirm availability and next steps directly; this is not an appointment confirmation.",
    "FreClean has received your contact enquiry. The team will reply to the email address you provided.",
    "Please check your name, email, phone and message details before sending again.",
    "This enquiry appears to have already been submitted. Please use the email option if you need to add information.",
    "Too many submissions were received recently. Please wait before trying again or draft an email to FreClean.",
    "This browser origin could not be verified. Your enquiry has not been sent; draft an email with these details and send it to FreClean.",
    "We could not confirm receipt of your enquiry. It has not been confirmed; draft an email with these details and send it to FreClean.",
    "FreClean service enquiry",
    "Verified publication",
    "Search",
    "Find your next step",
    "Search FreClean",
    "Close search",
    "Search the site",
    "Try services, products or booking",
    "No matching page found. Try a broader search.",
    "Home",
    "FreClean cleaning services and products in Leogane, Haiti",
    "Services",
    "Residential, commercial, hospitality and specialized cleaning",
    "Residential cleaning",
    "Cleaning for homes and apartments",
    "Commercial cleaning",
    "Cleaning for offices, retail and businesses",
    "Hospitality cleaning",
    "Guest-ready hotels, Airbnb and hospitality spaces",
    "Specialized cleaning",
    "Deep cleaning and tailored projects",
    "Products",
    "Cleaning essentials and fragrance products",
    "Business",
    "Cleaning plans for properties and working spaces",
    "Book a service",
    "Request a service and share your requirements",
    "Contact FreClean",
    "Send an enquiry to the FreClean team",
    "About FreClean",
    "Company information and local roots",
    "Resources",
    "Practical resources for cleaner spaces",
    "Payments",
    "Payment information and arrangements",
    "Privacy",
    "Privacy and data practices",
    "Terms",
    "Terms and conditions",
    "Quote request prepared:",
    "for a",
    ". FreClean will confirm the exact scope, availability and payment terms.",
    "FreClean uses this size range to prepare the requested quote, availability and service details.",
    "Loading payment addresses...",
    "USDT addresses are ready. FreClean confirms manual transfers directly.",
    "Payment addresses are currently unavailable. Please contact FreClean.",
    "Address copied.",
    "Select the address above to copy it.",
)
DYNAMIC_KEYS = ("common.forms.genericValidation",)


def flatten(value, prefix=""):
    result = {}
    for key, child in value.items():
        path = f"{prefix}.{key}" if prefix else key
        if isinstance(child, dict):
            result.update(flatten(child, path))
        elif isinstance(child, str):
            result[path] = child
        else:
            raise ValueError(f"Translation value must be text: {path}")
    return result


class CopyParser(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.skipped = []
        self.copy = set()
        self.jsonld = None

    def handle_starttag(self, tag, attributes):
        attrs = dict(attributes)
        if tag == "script" and attrs.get("type") == "application/ld+json":
            self.jsonld = ""
        if tag in SKIP_TAGS:
            self.skipped.append(tag)
        if attrs.get("data-i18n-skip") is not None:
            self.skipped.append("data-i18n-skip")
        for name, value in attributes:
            if not value:
                continue
            if name in TEXT_ATTRIBUTES:
                self.add(value)
            if name == "content" and any(attrs.get(key) == value for key, value in META_CONTENT):
                self.add(value)

    def handle_endtag(self, tag):
        if tag == "script" and self.jsonld is not None:
            try:
                self.add_structured_copy(json.loads(self.jsonld))
            except json.JSONDecodeError:
                pass
            self.jsonld = None
        if tag in self.skipped:
            self.skipped.remove(tag)

    def handle_data(self, data):
        if self.jsonld is not None:
            self.jsonld += data
            return
        if not self.skipped:
            self.add(data)

    def add_structured_copy(self, value):
        if isinstance(value, dict):
            for key, child in value.items():
                if key in {"name", "description", "serviceType", "alternateName"} and isinstance(child, str):
                    self.add(child)
                else:
                    self.add_structured_copy(child)
        elif isinstance(value, list):
            for child in value:
                self.add_structured_copy(child)

    def add(self, value):
        text = " ".join(value.split())
        if text and WORD.search(text) and not text.startswith(("http://", "https://")):
            self.copy.add(text)


def main():
    try:
        english = flatten(json.loads((LOCALES / "en.json").read_text(encoding="utf-8")))
        catalogs = {
            locale: flatten(json.loads((LOCALES / f"{locale}.json").read_text(encoding="utf-8")))
            for locale in TARGET_LOCALES
        }
    except (OSError, json.JSONDecodeError, ValueError) as error:
        print(f"Cannot load translation catalogs: {error}", file=sys.stderr)
        return 2

    english_keys = set(english)
    catalog_key_errors = {}
    empty_values = []
    for locale, catalog in catalogs.items():
        catalog_keys = set(catalog)
        missing_keys = sorted(english_keys - catalog_keys)
        extra_keys = sorted(catalog_keys - english_keys)
        if missing_keys or extra_keys:
            catalog_key_errors[locale] = (missing_keys, extra_keys)
        empty_values.extend(
            f"{locale}.{key}"
            for key in english_keys & catalog_keys
            if not english[key].strip() or not catalog[key].strip()
        )

    source_copy = set()
    for page in sorted(ROOT.rglob("*.html")):
        parser = CopyParser()
        parser.feed(page.read_text(encoding="utf-8"))
        source_copy.update(parser.copy)

    script_source = (ROOT / "script.js").read_text(encoding="utf-8")
    payment_script_source = (ROOT / "payments" / "payment-options.js").read_text(encoding="utf-8")
    all_script_source = script_source + payment_script_source
    expected_locales = {"en", *TARGET_LOCALES}
    language_list = re.search(r"var supportedLanguages = \[([^\]]+)\];", script_source)
    configured_locales = set(re.findall(r"'([a-z]{2})'", language_list.group(1))) if language_list else set()
    switcher_locales = set(re.findall(r'data-language="([a-z]{2})"', script_source))
    source_copy.update(DYNAMIC_COPY)
    source_copy.update(value for value in english.values() if value in all_script_source)
    source_copy.update(english[key] for key in DYNAMIC_KEYS if key in english and key in all_script_source)
    sources = set(english.values())
    missing_copy = sorted(source_copy - sources)
    unused_keys = sorted(key for key, value in english.items() if value not in source_copy)
    missing_dynamic_source = sorted(value for value in DYNAMIC_COPY if value not in all_script_source)

    counts = ", ".join(f"{locale}={len(catalog)}" for locale, catalog in {"en": english, **catalogs}.items())
    print(f"Catalog keys: {counts}")
    print(f"Static/dynamic source strings: {len(source_copy)}")
    locale_config_valid = configured_locales == expected_locales and switcher_locales == expected_locales
    if not locale_config_valid:
        print(
            "Language selector configuration does not match the catalogs: "
            f"supported={sorted(configured_locales)}, buttons={sorted(switcher_locales)}, "
            f"catalogs={sorted(expected_locales)}"
        )
    errors = []
    for locale, (missing_keys, extra_keys) in catalog_key_errors.items():
        errors.extend((missing_keys, extra_keys))
        if missing_keys:
            print(f"Missing {TARGET_LOCALES[locale]} keys ({len(missing_keys)}):")
            for key in missing_keys:
                print(f"  {key}")
        if extra_keys:
            print(f"Extra {TARGET_LOCALES[locale]} keys ({len(extra_keys)}):")
            for key in extra_keys:
                print(f"  {key}")
    for heading, values in (
        ("Empty translations", empty_values),
        ("Uncatalogued HTML or script strings", missing_copy),
        ("Dynamic audit literals absent from script.js", missing_dynamic_source),
        ("Unused English catalog entries", unused_keys),
    ):
        if values:
            print(f"{heading} ({len(values)}):")
            for value in values:
                print(f"  {value}")

    errors.extend((empty_values, missing_copy, unused_keys, missing_dynamic_source))
    return 1 if any(errors) or not locale_config_valid else 0


if __name__ == "__main__":
    raise SystemExit(main())