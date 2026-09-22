# IndiCraft High-Fidelity Prototype & UX Standards Checklist

1. Purpose

This document is a practical high-fidelity prototype checklist for the IndiCraft platform.

It adapts the structure and useful UX principles from the supplied ReStyle e-commerce checklist, while removing production-only concerns that are not required for the current IndiCraft prototype.

The goal is to make IndiCraft behave and look like a credible modern artisan-commerce product while keeping the scope focused on a high-fidelity demonstration rather than production infrastructure.

Current prototype priorities:

Premium but approachable Indian artisan-commerce experience.

Clear discovery of handcrafted products and craft categories.

Strong artisan storytelling and product provenance.

Simple buyer journey from discovery to cart to checkout/payment-link handoff.

AI shopping assistant presented as a natural conversational interface.

Voice-first interaction for search, product discovery, cart actions, checkout assistance, and payment-link generation.

Mobile and desktop usability.

Strong visual consistency and believable interaction states.

Explicitly out of scope for this prototype:

Escrow and marketplace transaction infrastructure.

SEO implementation.

Security hardening.

Privacy/legal/compliance implementation.

Production payment reconciliation.

Production multi-user authorization.

Production-grade pagination/API/database architecture.

Production monitoring, automated testing, deployment infrastructure, and operational tooling.

2. Source-Based Current State

The current IndiCraft website presents itself as a marketplace for handcrafted Indian goods, with the homepage emphasizing fabric, home decor, spices and related categories. The homepage currently contains a hero section, category discovery, featured products, a deal-of-the-day area, an artisan story section, navigation to shopping and vendor-related areas, and a newsletter section.

The current Shop experience provides category selection, price filtering, material and region filters, product counts, and product cards. The current product-detail experience includes product imagery, seller identity, price, stock state, material, region, add-to-cart functionality, shipping information, care instructions, return/exchange information, reviews, and related products.

The visible prototype also includes the Venmathi shopping assistant as a side-panel conversational interface. This should become a central part of the current IndiCraft experience rather than a decorative chatbot.

The current prototype should therefore be refined around three connected experiences:

Traditional visual shopping.

Conversational AI shopping.

Voice-assisted shopping and checkout support.

3. Status Legend

Use these statuses during implementation:

Not implemented

[~] Partially implemented / needs refinement

Implemented in prototype

[P] Prototype enhancement

[D] Design decision required

Recommended priority:

P0 — Core: anything required for the main demo journey.

P1 — High: improves realism, trust, and usability.

P2 — Medium: personalization and polish.

P3 — Future: advanced features that can remain mocked.

4. High-Fidelity E-Commerce Principles

4.1 Clarity

Users immediately understand that IndiCraft sells Indian handcrafted products.

The homepage communicates the artisan-first value proposition within a few seconds.

Product price, availability, category, material, and origin are easy to identify.

The primary action on every page is visually obvious.

AI-assisted actions are clearly distinguishable from normal navigation.

Voice actions have obvious state feedback.

4.2 Consistency

Use one navigation structure throughout the prototype.

Keep button hierarchy consistent.

Keep typography scale consistent.

Keep card proportions consistent.

Keep border-radius rules consistent.

Use one icon family.

Use consistent badges for artisan, regional, sustainable, festive, and limited-collection states.

Use consistent loading, success, error, and empty-state patterns.

4.3 Trust

Artisan identity is visible without overwhelming the product information.

Craft origin and region are easy to find.

Material information is visible.

Handmade variation is explained where relevant.

Shipping information is shown before checkout.

Return/exchange information is easy to locate.

Buyer can understand why a product is considered authentic or artisan-made.

AI assistant does not invent unavailable product information.

4.4 Friction Reduction

Browsing does not require login.

Search and shopping can begin immediately.

Product actions provide immediate feedback.

Cart actions are reversible.

Voice commands can perform common actions without forcing users through unnecessary screens.

The AI assistant remembers the immediate shopping context during a session.

The user can move between visual shopping and conversational shopping without losing context.

4.5 Mobile-First Practicality

Core shopping flows work comfortably on mobile.

Search is easy to reach.

Filters can open in a bottom sheet or drawer.

Product cards remain readable.

Product images do not unnecessarily consume the entire viewport.

Cart and checkout controls remain reachable.

Voice controls are easy to activate with one hand.

The AI assistant panel becomes a bottom sheet/full-screen conversational experience on small screens.

No horizontal scrolling is required.

5. Global Navigation & Information Architecture

5.1 Header

The current IndiCraft header already establishes the primary shopping entry points and global search. The high-fidelity version should make the hierarchy more intentional.

Logo always returns to Home.

Shop is the primary shopping destination.

Main categories are limited to useful high-level destinations.

Global search is always accessible.

Cart is always accessible.

AI assistant trigger is always accessible.

Voice-assistant trigger is clearly recognizable.

Seller/Vendor access is separated from buyer navigation where appropriate.

Header remains visually stable across pages.

Mobile navigation uses a deliberate bottom-sheet/drawer structure.

5.2 Navigation Taxonomy

Recommended structure:

Home

Shop

Fabric

Home Decor

Household

Mugs

Spices

Other Craft Categories

Artisans / Our Stories

AI Shopping Assistant

Cart

Account

Do not expose every feature in the primary navigation. The AI assistant should be discoverable globally without becoming the only way to shop.

5.3 Breadcrumbs

Shop pages show category context.

Product pages show category → product hierarchy.

Breadcrumb names match the actual navigation labels.

Breadcrumbs collapse appropriately on mobile.

6. Homepage Checklist

The current homepage already contains a hero area, category cards, featured products, a deal section, and an artisan story section. The high-fidelity goal is to make these sections work together as a clear conversion journey.

6.1 Above-the-Fold

Brand is immediately recognizable.

Value proposition is understandable within seconds.

Hero image communicates Indian craftsmanship rather than generic e-commerce.

Primary CTA leads to the main collection.

Secondary CTA can launch Venmathi/voice shopping.

AI assistant trigger is visible without competing with the primary shopping CTA.

Recommended hero structure:

Headline → Short artisan/value statement → Shop CTA → Ask Venmathi CTA

6.2 Hero Area

Hero photography has strong craftsmanship context.

Text has sufficient contrast.

Promotional badge does not dominate the artisan story.

CTA labels are action-oriented.

Avoid overloading the hero with multiple offers.

Hero does not feel like a generic fashion marketplace.

6.3 Category Discovery

Show major categories with clear visual identity.

Category names are concise.

Product count is optional and visually secondary.

Category imagery matches the actual category.

Clicking a category produces an obvious transition to Shop.

Recommended category emphasis:

Fabric | Home Decor | Household | Mugs | Spices | Regional Crafts

6.4 Featured Products

Feature products that demonstrate variety.

Show artisan/region metadata where useful.

Show price and stock state.

Keep product cards visually consistent.

Provide quick Add to Cart or View Product action.

Avoid fake scarcity language unless the prototype explicitly labels it as promotional content.

6.5 Artisan Story Section

Explain why buying from IndiCraft matters.

Show real or representative artisan storytelling.

Connect the story to product discovery.

Use regional/craft context rather than generic sustainability statements.

CTA can lead to an artisan collection or story page.

6.6 Venmathi Entry Point

The AI assistant should be introduced as a shopping companion rather than a generic chatbot.

Recommended copy pattern:

Ask Venmathi

"Tell me what you are looking for. I can find products, compare options, add them to your cart, and help you complete checkout."

Suggested quick prompts:

"Find me a handmade gift under ₹1,500."

"Show me home decor from Rajasthan."

"Find a traditional fabric for a wedding."

"Buy the Naga shawl."

"What can I get for ₹2,000?"

6.7 Footer

Shop categories.

Our Artisans.

Contact.

Vendor Sign Up.

Newsletter.

Basic support entry point.

Keep the footer simple for the prototype.

7. Search Standards

7.1 Search Box

Search available globally.

Placeholder communicates product discovery.

Search supports product name.

Search supports category.

Search supports material.

Search supports region.

Search supports artisan/craft terminology.

Search tolerates basic spelling variations.

Voice search can feed directly into the same search experience.

7.2 Search Results

Show the searched term.

Show result count.

Provide category/price/material/region filters.

Provide sort options.

Preserve the search context while filtering.

Provide a useful no-results state.

Suggest similar products or categories when appropriate.

7.3 Conversational Search

Venmathi should treat natural-language requests as shopping intent, not merely as text search.

Examples:

User: "I need a traditional gift for my sister under ₹2000."

Agent should interpret: gift intent + recipient + budget + cultural preference.

User: "Show me something from Rajasthan."

Agent should interpret: region preference.

User: "Get me that one."

Agent should use: the immediately preceding visual/conversational context.

The assistant should show its interpretation in plain language before performing a consequential action.

8. Category / Product Listing Page Checklist

8.1 Page Structure

Breadcrumb.

Category title.

Short contextual description.

Product/result count.

Filter control.

Sort control.

Active filter chips.

Product grid.

Clear empty state.

8.2 Product Grid

Consistent image ratio.

Product name.

Price.

Material where useful.

Region/origin where useful.

Artisan/seller indicator.

Availability.

Wishlist control if included in the prototype.

Quick add-to-cart.

Cards remain usable on mobile.

8.3 Product Images

Use visually consistent product photography.

Show enough detail to judge texture/material.

Avoid excessive visual effects.

Keep image framing consistent.

Provide an enlarged view from the product page.

8.4 Filter System

Recommended filters:

Category

Price

Material

Region

Craft type

Seller/artisan

Availability

Prototype rule:

Every visible filter must actually change the displayed product set. Do not build decorative filters that only pretend to work.

8.5 Sorting

Recommended prototype options:

Recommended

Newest

Price: Low to High

Price: High to Low

Popular

9. Product Card Standards

Product image is the main visual element.

Product name is concise.

Price is prominent.

Region/material metadata is secondary.

Artisan identity can appear as a small supporting label.

Wishlist state is clear.

Add-to-cart gives immediate feedback.

Sold-out state is unmistakable.

Promotional badges do not cover important product information.

Card remains usable without hover on mobile.

Recommended card information hierarchy:

Image → Product Name → Artisan/Region → Price → Action

10. Product Detail Page Standards

The current product pages already provide product imagery, seller, price, stock, material, region, care instructions, shipping, returns, reviews, and related products. The high-fidelity version should strengthen the information hierarchy and artisan story.

10.1 Product Information

Product title.

Seller/artisan/co-op.

Price.

Stock status.

Material.

Region.

Craft type.

Short description.

Care instructions where relevant.

Shipping information.

Return/exchange information.

Artisan story or origin summary.

10.2 Product Photography

Main product image.

Detail/texture image.

Contextual image where useful.

Image gallery is easy to navigate.

Enlarged view available.

Product remains visually dominant over interface controls.

10.3 Purchase Area

Price prominent.

Availability clear.

Add to Cart primary action.

Buy/checkout shortcut can be provided.

Ask Venmathi action available.

Voice command can add the current product to cart.

Suggested AI action:

"Ask Venmathi about this product"

Possible prompts:

"Tell me about this craft."

"Is this a good gift?"

"Find similar products."

"Add this to my cart."

10.4 Artisan Information

Show artisan/co-op name.

Show craft region.

Give a short human-readable story.

Link to related products from the same artisan or region where appropriate.

Avoid exposing unnecessary personal contact information.

10.5 Authenticity / Cultural Context

Clearly distinguish platform-provided information from verified certifications.

Do not claim a certification unless the prototype has the supporting data.

Explain cultural significance without making unsupported claims.

QR product identity can be demonstrated as a prototype interaction.

11. Cart Standards

11.1 Cart Data

For the prototype, cart state can be maintained locally during the demo session.

Cart survives navigation.

Cart count is visible.

Product availability is reflected in the UI.

Quantity controls behave logically for multi-quantity products.

One-of-one items cannot visually appear as endlessly purchasable.

Removing an item updates the total immediately.

11.2 Cart UI

Product image.

Product name.

Artisan/seller.

Price.

Quantity.

Remove action.

Subtotal.

Shipping estimate or shipping message.

Total.

Checkout CTA.

Continue Shopping CTA.

"Ask Venmathi" CTA.

11.3 AI Cart Interaction

Supported prototype commands:

"Add the shawl to my cart."

"Remove the coasters."

"What is in my cart?"

"How much is my cart?"

"Show me cheaper alternatives."

"Checkout my cart."

The agent should summarize the resulting state after each meaningful cart mutation.

12. Checkout Standards

12.1 Checkout Structure

Recommended prototype sequence:

Cart review

Delivery information

Order summary

Payment method / payment-link option

Confirmation

Keep the checkout visually simpler than the shopping experience.

12.2 Address Form

Full name.

Phone.

Address.

City.

State.

PIN code.

Country if required.

Clear field labels.

Helpful validation messages.

Do not overwhelm the user with unnecessary fields.

12.3 Order Summary

Products.

Artisan/seller where useful.

Quantity.

Item price.

Shipping.

Discount if applicable.

Final payable amount.

Return information.

12.4 Payment Link Flow

The current voice-agent concept should treat payment-link generation as a handoff rather than attempting to simulate a full financial backend inside the prototype.

Recommended sequence:

User asks to buy → Agent confirms items → Agent summarizes total → Agent prepares payment link → User receives link / payment handoff → UI shows pending-payment state

The prototype should clearly distinguish:

"Payment link generated" from "Payment completed."

Never show a fake successful payment state merely because the user clicked a demo button.

14. Order Tracking

Since the high-fidelity prototype does not require production logistics integration, use a believable visual order lifecycle.

Recommended prototype lifecycle:

Order placed → Payment pending/confirmed → Artisan preparing → Shipped → In Transit → Delivered

Order number shown.

Product(s) shown.

Delivery destination summarized.

Order status visible.

Timeline is visually obvious.

Payment-link state is distinguishable from delivery state.

Voice agent can answer "Where is my order?" using the current demo state.

15. Notifications

For the prototype, use in-app notifications/toasts rather than production email/SMS systems.

Recommended demo notifications:

Product added to cart.

Item removed from cart.

Payment link generated.

Order placed.

Order shipped.

Order delivered.

AI action completed.

Voice command understood.

Voice command needs clarification.

Notifications should link back to the relevant page or assistant context.

16. Authentication & Account Experience

Production authentication is intentionally out of scope.

For a high-fidelity prototype:

Use a simple mock account state if account screens are required.

Provide Profile as a visual destination.

Avoid building password recovery, session infrastructure, or role authorization.

Keep user identity only where needed to make the prototype journey believable.

Do not let account UI distract from the marketplace and AI shopping journey.

17. Seller Experience

The seller experience is important to IndiCraft's ecosystem, but the current high-fidelity prototype should focus on representative interactions rather than a production seller platform.

17.1 Vendor / Sell Flow

Vendor Sign Up entry point.

Artisan profile preview.

Craft category.

Product title.

Product description.

Material.

Region.

Price.

Product images.

Listing preview.

Submit/list product CTA.

Use guided steps rather than a large form if the goal is to demonstrate accessibility.

17.2 Listing Quality

Product images are clear.

Category is selected.

Material is specified.

Region is specified.

Price is visible.

Product description is readable.

Artisan story can be attached.

Product status is visually obvious.

17.3 Seller Dashboard

Prototype dashboard can show:

Active products

Recent orders

Estimated earnings

Pending actions

Low-stock examples

Product performance snapshots

Use representative data only and label it as demo data where needed.

18. Wishlist

Add/remove wishlist action.

Wishlist page is visually coherent.

Empty state exists.

Wishlist item can move to cart.

Wishlist item can open the product page.

Voice commands can add/remove items.

Suggested commands:

"Save this for later."

"Show my wishlist."

"Move my saved shawl to the cart."

19. Artisan / Cultural Stories

Replace ReStyle-specific wardrobe functionality with a core IndiCraft experience around artisans and crafts.

Artisan story cards.

Craft-region pages.

Craft history/context sections.

Related products.

Product-to-artisan relationship.

Product-to-region relationship.

Story CTA from product pages.

Story CTA from homepage.

This should not become a generic blog. Every story should help the buyer understand the product or the craft.

20. AI Shopping Assistant Standards

Venmathi is a core product experience and should be treated as an intelligent shopping interface rather than a decorative chat window.

20.1 Assistant Identity

Assistant has a consistent name and visual identity.

Assistant clearly communicates its role as a shopping assistant.

Assistant does not pretend to be a human artisan.

Assistant responses are concise enough for shopping.

Assistant can use product/catalog context.

20.2 Conversation Design

Every response should move the user toward a useful shopping action.

Good pattern:

Understand → Recommend → Explain briefly → Offer action

Example:

"Since you want a traditional gift under ₹2,000, I found three options: a Meenakari box, a Naga shawl, and marble coasters. The Meenakari box is ₹1,850. Want me to add it to your cart?"

20.3 Quick Actions

Recommended quick prompts:

Find a product.

Recommend a gift.

Show similar products.

Explain this product.

Add to cart.

View cart.

Checkout.

Generate payment link.

Track order.

20.4 Context Handling

The assistant should understand references such as:

"this one"

"the cheaper one"

"the one from Rajasthan"

"add the second option"

"remove that"

"show me similar ones"

The UI should preserve enough recent context for these interactions to feel natural.

20.5 Action Confirmation

Require a concise confirmation before consequential actions in the prototype:

"I found the Naga Handwoven Shawl for ₹2,100. Add it to your cart?"

After action:

"Added the Naga Handwoven Shawl to your cart."

For checkout:

"Your cart is ₹3,050 before shipping. Generate the payment link?"

20.6 Failure / Uncertainty

If a product is not found, say so.

Suggest alternatives.

Ask a clarifying question when necessary.

Do not invent stock, price, shipping, artisan, or certification data.

Do not claim payment success without an explicit prototype state.

21. Voice Shopping Assistant Standards

Voice interaction is a major differentiator of the current IndiCraft prototype.

21.1 Voice Entry Point

Microphone button is visually obvious.

Voice control can be activated from the header or assistant panel.

Voice mode clearly indicates when listening is active.

User can stop/cancel listening.

Voice and text conversation remain part of the same assistant session.

21.2 Voice Conversation Flow

Recommended interaction:

Tap microphone → Listening → User speaks → Processing → Assistant response → Optional action confirmation

Each state must have a visible visual change.

21.3 Voice Feedback

Use:

Listening animation.

Transcript preview.

Processing indicator.

Spoken response where available.

Text transcript for accessibility and clarity.

Action result card when the agent performs a shopping action.

21.4 Voice Command Categories

Discovery

"Find handmade gifts under ₹1,000."

Filtering

"Show only products from Rajasthan."

Comparison

"Which one is cheaper?"

Cart

"Add the coasters."

Checkout

"Checkout my cart."

Payment

"Generate the payment link."

Order Support

"Where is my order?"

21.5 Voice-to-UI Synchronization

When the agent speaks about a product, the relevant product card should appear or highlight in the UI.

When the agent adds an item to cart:

Cart count updates.

Product card/action state updates.

Assistant confirms the action.

When the agent prepares checkout:

Checkout panel appears.

Order summary becomes visible.

Payment-link action becomes visible.

The user should always be able to understand what the agent is doing without listening to audio alone.

22. Accessibility Checklist

Target a high-quality, WCAG-oriented experience for the prototype without turning this into a formal compliance audit.

22.1 Keyboard

Main navigation usable with keyboard.

Search usable with keyboard.

Product cards reachable.

AI assistant can be opened and closed.

Cart controls are keyboard reachable.

Dialog focus is understandable.

22.2 Screen Readers

Buttons have meaningful labels.

Inputs have labels.

Product images have useful alt text.

AI assistant trigger has a clear accessible name.

Voice button has a clear accessible name.

Dynamic shopping updates are announced where practical.

22.3 Visual Accessibility

Sufficient text contrast.

Controls are distinguishable.

Do not rely only on colour for stock/order state.

Focus states are visible.

Error and success states include text/icon cues.

22.4 Forms

Labels remain visible.

Required fields are obvious.

Error messages are specific.

Inputs retain valid values after an error.

Image uploads provide preview feedback.

23. Responsive / Mobile E-Commerce Checklist

Test the prototype at:

320px

375px

390px

430px

Tablet

Desktop

Large desktop

Core tasks that must remain usable:

Browse.

Search.

Filter.

Product details.

Add to cart.

View cart.

Checkout.

Open Venmathi.

Use voice assistant.

Receive/display payment link.

Mobile AI pattern:

Floating assistant button → bottom sheet → full conversational surface when needed.

24. Performance Checklist

For the prototype, prioritize perceived performance rather than production infrastructure.

Homepage loads quickly enough for a live demo.

Images are compressed to reasonable sizes.

Above-the-fold content loads first.

Product grids do not feel sluggish.

AI assistant shows an immediate processing state.

Voice transcription has visible feedback.

Checkout actions do not appear frozen.

Use skeletons or progress indicators for simulated latency.

Prototype rule:

Do not hide an important action behind an indefinite spinner. Every simulated AI/network action should have an obvious response state.

30. Empty States

Every important surface should have a designed empty state.

Required prototype states:

Empty cart.

Empty wishlist.

No search results.

No category results.

No orders.

No assistant context.

No voice transcript.

No recommendations.

No products matching the user's budget.

Every empty state should contain:

Explanation.

Helpful next step.

Clear action.

Example:

No products found

"Nothing matched all three filters. Try widening the price range or asking Venmathi for alternatives."

[Show Alternatives]

31. Loading States

Recommended loading states:

Product grid skeleton.

Product detail skeleton.

Cart loading.

Checkout loading.

AI response loading.

Voice processing state.

Recommendation loading.

Payment-link generation state.

Use meaningful states rather than generic spinning indicators.

Examples:

Venmathi is finding products…

Preparing your cart…

Generating your payment link…

32. Error Handling

Every prototype error should answer:

What happened?

What should the user do?

Can the user retry?

Examples:

Voice input not understood

"I didn't catch that. Try saying something like 'find handmade gifts under ₹1,500.'"

No matching product

"I couldn't find an exact match. I found three similar options instead."

Payment-link generation unavailable

"I couldn't generate the link right now. Your cart is still saved."

Never show raw technical errors to the user.

33. Toast / Feedback Standards

Use short, clear feedback messages.

Examples:

"Added to cart."

"Removed from cart."

"Saved to wishlist."

"Venmathi found 4 matching products."

"Order summary ready."

"Payment link ready."

"Voice command understood."

Important actions should also update the relevant UI, not rely only on a toast.

34. Forms

Use explicit labels.

Keep forms short.

Show required fields clearly.

Validate obvious input errors.

Preserve existing data after validation errors.

Provide upload previews.

Avoid long uninterrupted forms.

Use guided steps for seller onboarding.

35. Design System Audit

IndiCraft should have a formal visual language even at prototype stage.

35.1 Visual Tokens

Define and reuse:

Primary brand colour.

Secondary accent.

Background colour.

Surface colour.

Primary text.

Secondary text.

Border.

Success.

Warning.

Error.

Spacing scale.

Typography scale.

Border-radius scale.

Shadow scale.

Motion timings.

Suggested visual direction for the existing platform:

Warm, craft-inspired neutrals as the foundation.

Orange/saffron-style accent for primary actions.

Dark charcoal text for readability.

Muted natural tones for category and artisan storytelling.

Product imagery should remain the dominant visual element.

Do not turn the entire interface into a festival poster. The products need somewhere to breathe.

35.2 Components

Standardize:

Navbar.

AI assistant trigger.

Voice button.

Assistant panel.

Chat bubble.

Voice transcript.

Product card.

Product grid.

Category card.

Filter panel.

Sort control.

Button.

Input.

Select.

Modal.

Drawer.

Toast.

Badge.

Breadcrumb.

Empty state.

Loading skeleton.

Error state.

Price display.

Cart item.

Order timeline.

Payment-link card.

Artisan story card.

36. Product Data Quality Standards

Every prototype product should use consistent structured data.

Required fields:

Product name.

Category.

Price.

Material.

Region.

Artisan/seller.

Description.

Product image(s).

Availability.

Care information where relevant.

Return information where relevant.

Consistency matters because the AI shopping agent depends on the same product data that visual search uses.

The same product should not appear as:

"Meenakari Box"

in one interface and:

"Traditional enamel jewellery box from Rajasthan"

as a completely unrelated entity in another. Use normalized product records behind the prototype experience.

37. Marketplace Trust Standards

Even without production security and legal infrastructure, the prototype should visually communicate trust.

Artisan/seller name visible.

Craft region visible.

Product material visible.

Product origin/context visible.

Return information visible.

Shipping information visible.

Buyer reviews can be shown as representative prototype data if clearly treated as demo content.

Avoid unsupported certification badges.

Avoid fake claims about artisan income or sustainability impact.

Clearly distinguish prototype/demo data from verified marketplace data where necessary.

Prototype Scope Summary

Build deeply:

Marketplace browsing, category discovery, search and filtering.

Product detail, artisan story, cart, checkout UI and payment-link handoff.

Venmathi conversational shopping and voice-assisted shopping.

Product-aware recommendations, cart actions, checkout assistance and visible UI updates.

Responsive design, loading states, empty states, errors and success feedback.

Consistent design system and trust-oriented product information.

Keep lightweight / mocked:

Authentication and account state.

Seller management and order data.

Logistics and shipment data.

Payment completion.

Product verification backend.

Government-scheme recommendation backend.

AI model infrastructure and analytics.

Do not spend prototype time on:

Production security architecture.

Production compliance/legal implementation.

Full multi-user authorization.

Production SEO.

Production monitoring.

Full database/API scaling.

Enterprise deployment infrastructure.

The guiding principle is to make IndiCraft feel real through coherent interactions, believable states, strong information architecture, and a polished visual system, rather than pretending a prototype already has production-scale infrastructure.
