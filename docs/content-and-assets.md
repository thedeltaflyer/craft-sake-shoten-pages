# Content and asset record

Reviewed 2026-09-21. This is a release candidate, not an assertion that all launch checks have been completed.

## Preserved originals

Copies are byte-for-byte originals. No build reads the archive. The old archive is deliberately retained.

| Archive source | Preserved destination | Pixels |
| --- | --- | --- |
| `old/Craft Sake Shoten Official_files/css_ez1n.webp` | `src/assets/brand/logo.webp` | 326 × 318 |
| `old/Craft Sake Shoten Official_files/jiu2_ez1n.webp` | `src/assets/photos/sake.webp` | 1372 × 1404 |
| `old/extra images/yokohama1.webp` | `src/assets/photos/yokohama.webp` | 1200 × 710 |
| `old/extra images/craft_sake_yokohama.jpg` | `src/assets/photos/yokohama-entrance.jpg` | 773 × 580 |

Icons and 1200 × 630 sharing images are reproducibly derived with `npm run assets`. Astro creates local responsive WebP variants. Kawasaki now uses the supplied shop scene for its homepage card, arch hero and sharing image, with the refrigerator and counter photographs beside its FAQ (above it on mobile). The older logo.webp is an inactive historical original; logo.png supplies every header and both PNG icons. The home sharing-photo source remains unchanged; both location sharing images use the new shop scenes. Logo derivatives preserve the transparent exterior and opaque white artwork. The dining logo, menus and event imagery are excluded. Asset ownership/licensing remains the owner's responsibility to confirm before publication.

## Supplied originals integrated 2026-09-21

The four supplied originals were moved from the temporary `new_images` directory byte-for-byte; pre/post-move SHA-256 values matched. The directory was removed only after it was empty. Header WebP widths are 48/64/96/128px; icons are 64px and 180px square. Kawasaki supporting derivatives are capped at 660px.

| Supplied filename | Permanent destination | Pixels | SHA-256 before and after |
| --- | --- | --- | --- |
| `logo.png` | `src/assets/brand/logo.png` | 1921 × 1921 | `5f8c89a8ccae7192df92d5276f457f6f32305fa398b4034d6c3d6559503560b3` |
| `kawasaki_front.JPG` | `src/assets/photos/kawasaki-front.jpg` | 5231 × 3487 | `348f14740c77008dd12c1690be6e23b4b3a83341bab8a3bd654827974517c6b4` |
| `IMG_5650.JPG` | `src/assets/photos/kawasaki-interior-fridge.jpg` | 660 × 370 | `0a5af8ac8a021eda4b2b083f7c2127a2f92d052150914d8ed7beb500160459eb` |
| `IMG_5651.JPG` | `src/assets/photos/kawasaki-interior-counter.jpg` | 660 × 370 | `1bc8db64feb3affcef2947567f9e48a16806b5243bd4562275e403e1558b171c` |

## Sources and editorial decisions

- Brand/community story: archived official home page, paragraphs beginning “Craft Sake Shoten offers” and “From widely appreciated favorites”. Rewritten without prices, bottle counts, food claims or guarantees.
- [Official Yokohama listing](https://craftsakeshoten.com/yokohamabar): address, opening hours and no-reservation-required policy corroborate the saved page. Published schedule: Tue–Thu 17:00–22:00, Fri 17:00–23:00, Sat 17:00–22:00, Sun/Mon closed. An owner recheck before launch is still recommended because this source also contains old events. Walking duration and prices omitted.
- [Official Kawasaki listing](https://craftsakeshoten.com/kawasakikitchen): address/map and Instagram corroborate the archive, but the service description is stale. Hours conflict across historic official pages and cannot be verified for the changed service. The website therefore directs visitors to Kawasaki Instagram instead of publishing an unverified schedule. No openingHours JSON-LD is emitted for Kawasaki.
- [Muza tenant directory](https://muzakawasaki.com/shop_restaurant/153/) corroborates 1310 Omiyacho and the tenant. Its description is also stale. The English archive gives 1F, while the Japanese archive gives 153. We publish the common building address with the archived floor, omitting the uncertain unit number; do not claim 153 independently verified. Owner must confirm the full floor/unit address before launch.
- The earlier brief stated no food service and no reservations accepted. The current approved plan supersedes the published reservation copy with “No reservation is required. For other visiting questions, contact the Kawasaki shop on Instagram.” / “予約は不要です。その他のご来店に関するご質問は、川崎店のInstagramへお問い合わせください。” This appears in the visit section and FAQ, matching Yokohama. It does not independently verify a change in food service or hours.
- Naming is provisional “Craft Sake Shoten” plus location. Current official names require owner confirmation.
- Instagram destinations extracted without Wayback wrappers: Yokohama `https://www.instagram.com/craftsakeshoten/`, Kawasaki `https://www.instagram.com/craftsakeshotenkawasaki/`. Automated Instagram retrieval was unavailable; confirm accounts and response/contact availability manually before launch. No unverified telephone or email is published.
- Map destinations extracted from address links: Yokohama `https://maps.app.goo.gl/GTe5G3uBdNcQgTiW9`, Kawasaki `https://maps.app.goo.gl/jbxT87Bs1cUszbsj8`. Destination pins must be manually checked on a real device before launch.

## Outstanding launch checks

Owner sign-off: Kawasaki hours/floor/unit, both official shop names, public contact channels, Yokohama policy and schedule, Japanese editorial review. Cloudflare preview: actual redirect query/fragment preservation, headers on Pages and custom hostnames, unknown-path 404 and outbound destinations. Production cutover must wait for these checks.

## Six supplied photographs integrated 2026-09-21

Byte-preserving moves from `new_photos`; SHA-256 was measured before and after every move and matched. The temporary directory was removed only when empty. Existing originals and FAQ photographs remain preserved.

| Supplied filename | Permanent destination | Pixels | SHA-256 before and after | Placement |
| --- | --- | --- | --- | --- |
| kawasaki_shop.webp | src/assets/photos/kawasaki-shop.webp | 2048 × 1152 | d79d11b6f24c23f3bd6045e5ac2f11cc53c5f982eb8cc3c00c5510aeb44a8ce2 | Kawasaki hero, card and sharing image |
| yokohama_shop.webp | src/assets/photos/yokohama-shop.webp | 957 × 634 | 5ff8303a8c1e4bfad6b52f56f8c94113233833d8582527aa4117c808a591528c | Yokohama hero, card and sharing image |
| yokohama_sake.webp | src/assets/photos/yokohama-sake.webp | 5472 × 3648 | 1eee4a9be60a30b9fcfca79fe7d28bceb914e395438b0d5fc58a289e158f5052 | Homepage story |
| yokohama_crowd.webp | src/assets/photos/yokohama-crowd.webp | 813 × 905 | 483adc5f702e79ba3324c7ccca849e544866955a45755a5f3a73bfb39c87e929 | Yokohama gallery |
| yokohama_selection.webp | src/assets/photos/yokohama-selection.webp | 1602 × 1112 | 5e0d09474b8f285e015f90d68014768d58a7f5bfe915ebce790ba81539ba2d35 | Yokohama gallery |
| yokohama_sake2.webp | src/assets/photos/yokohama-sake-2.webp | 1598 × 1404 | d94b0f25808f87a5940d64ea4b55efcdcfa558792ce47eb152146eb5329db87c | Yokohama gallery |

## Verbatim homepage story approved 2026-09-21

The user supplied and explicitly authorized both paragraphs below verbatim, preserving their differing wording and the Japanese line breaks. Both include price and food claims; the Japanese wording describes both shops. This supersedes the earlier editorial decision to omit these claims from the homepage story. It is user-supplied copy, not independent verification of Kawasaki service or hours. Existing story paragraphs remain, followed by this detail and the bottle photograph.

English:

```text
Craft Sake Shoten offers casual bar and restaurant experiences with an ever changing sake lineup. Started in 2017 in Yokohama, our concepts have become community social spots revolving around Great Sake, Good People. Whether you’re in for premium sake at 500 yen a glass or innovative Western x Japanese small plates paired with sake in an intimate stylish counter bar, we are here to make your experience exceptional.
```

Japanese:

```text
アメリカ出身の経験豊富なソムリエが厳選した日本酒を取り揃える「Craft Sake Shoten」では、常に変わる日本酒メニューをお楽しみいただけます。
2017年に横浜で始まった当店は、「素晴らしい日本酒と良い人々が集う場」として、地域社会に根ざしたお店となりました。
現在、当店では二つの店舗を構え、一杯500円から楽しめるプレミアム日本酒や、西洋と日本の食材を組み合わせた革新的な小皿料理と上品な日本酒をスタイリッシュなカウンターバーでご提供しています。
どちらの店舗でも、お客様一人ひとりの訪問が特別な体験となるよう、心からのおもてなしを心掛けております。
```

## Kawasaki directions photo integrated 2026-09-22

The preserved kawasaki-front.jpg now appears beneath the Kawasaki getting-here directions so visitors can recognize the storefront. It uses responsive, lazy-loaded Astro Image derivatives and the existing English/Japanese storefront alt text.

## Social sharing metadata — 2026-09-22

Each page explicitly declares its existing 1200 × 630 JPEG in Open Graph and X/Twitter large-image metadata, with English alt text. The homepage (and 404 fallback) uses the sake bottle photo; location pages use their respective shop scenes. Sharing metadata remains static English during language switching. Actual social-platform previews require publicly accessible deployment and are not verified locally.

## Homepage search metadata — 2026-09-25

The user supplied and authorized new English and Japanese homepage titles and descriptions verbatim. The descriptions introduce around 50 rotating sakes, seasonal and rare releases, sommelier selection, and glasses mostly priced at ¥600–700. These are user-supplied claims, not independent verification; the previously approved homepage story remains unchanged. English metadata is present in static HTML and sharing tags; Japanese title and description use the existing client translation bindings. The shared URL does not provide a separately indexable Japanese document, so language-specific Google results are not assured.

## Homepage hero replacement — 2026-09-25

The user-supplied new_photos/kawasaki_sake.jpg was moved byte-for-byte to src/assets/photos/kawasaki-sake.jpg (660 × 370; SHA-256 62c1e38bfbe1229b88718eb45c1ab1c7c258cb93c32d211a0984665cd009e903). The empty temporary directory was removed. The new photo supplies the homepage arch hero with eager loading, high fetch priority, English/Japanese alt text, and responsive derivatives capped at 660px. The former hero, sake.webp, now appears below the story heading with lazy loading and its original proportions. The existing wide story photograph and social sharing image remain unchanged.

## Homepage story image removal — 2026-09-25

At the user’s request, sake.webp was removed from the homepage story section. The original asset remains preserved and continues to supply the homepage sharing image. The Kawasaki hero and wide Yokohama story photo remain in place.

## Kawasaki homepage card replacement — 2026-09-25

The user-supplied new_photos/kawasaki_hero.jpg was moved byte-for-byte to src/assets/photos/kawasaki-hero.jpg (660 × 370; SHA-256 8f2b81c04959e92a68f294b8b70a1fb2c8769b6c9b2540ebbd0305a869715dc3). The empty temporary directory was removed. The photo replaces only the Kawasaki homepage card, using lazy-loaded Astro Image derivatives capped at its native width. The original kawasaki-shop.webp remains preserved and supplies the Kawasaki location hero and sharing image.

## Homepage story banner replacement — 2026-09-25

The user-supplied new_photos/craft-sake-banner.webp was moved byte-for-byte to src/assets/photos/craft-sake-banner.webp (3000 × 1000; SHA-256 e3e299b95e94e844466bf6f1580a6b067721b859f6f82d37e00d1133f0ff5dbf). The empty temporary directory was removed. It replaces the wide Our Story photograph with responsive, lazy-loaded Astro Image derivatives and matching English/Japanese alt text. The full 3:1 composition is retained at all widths. The previous yokohama-sake.webp original remains preserved.

## Contact inquiries approved 2026-09-26

The approved contact plan adds Questions, Feedback, Private Reservation and Other on all three pages. Private Reservation is available for both shops as an inquiry only. At the user’s subsequent request, the pre-submit reservation disclaimer was removed in both languages. The accepted-submission status still explains that a reservation is not confirmed. This does not establish new service, opening hours, booking availability or food facts. Existing visiting policies, reservation anchors and Instagram alternatives remain. The destination and sender are private runtime secrets; the selected shop categorizes the inquiry. Real delivery and operator configuration require separate verification.
