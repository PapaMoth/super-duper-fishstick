import { Compound } from "@/lib/types";

// Seed dataset — hand-verified against primary/secondary sources during initial research.
// IMPORTANT (see README "Data integrity"): this list is a STARTER set, not a
// comprehensive or auto-updating feed yet. Every entry below was checked against
// at least one cited source as of Oct 2026. Before this product can be sold to
// pharmacies/clinics as something they rely on, the data pipeline needs to move
// to scheduled scraping + a human review step (see roadmap in README).

export const compounds: Compound[] = [
  {
    slug: "retatrutide",
    name: "Retatrutide",
    category: "GLP-1 / Triple Agonist",
    description:
      "A triple agonist targeting GLP-1, GIP, and glucagon receptors simultaneously. Investigated for obesity and metabolic disease, it produced greater weight loss than dual agonists in Phase 2 trials. Not FDA-approved.",
    status: "no-pathway",
    statusNote:
      "Never FDA-approved and never placed on an FDA drug shortage list — both are preconditions for a 503A/503B compounding exception. No legal compounding pathway currently exists under any formulation theory.",
    lastChanged: "2026-10-19",
    enforcement: [
      {
        date: "2026-03-31",
        summary:
          "FDA warning letter to Gram Peptides for selling unapproved retatrutide, tirzepatide, and bacteriostatic water for injection; RUO labeling rejected as a defense.",
        source:
          "https://www.fda.gov/inspections-compliance-enforcement-and-criminal-investigations/warning-letters/gram-peptides-721806-03312026",
      },
      {
        date: "2026-03-01",
        summary:
          "Multiple vendors (Prime Sciences, Mile High Compounds, Pink Pony Peptides, PekCura Labs) cited for selling retatrutide under coded names (e.g. 'GLP-3 RT') to evade RUO scrutiny.",
        source: "https://caminostrategygroup.com/resources/retatrutide",
      },
      {
        date: "2026-08-24",
        summary:
          "FDA warning letters to five online vendors (Peak Performance Peptides, Royal Peptides, NuScience Peptides, Peptide Partners, TXP Innovations) again named retatrutide — marketed under coded names such as 'GLP-3 RT', 'GLP-3 Reta', and 'GLP-3R' — as an unapproved new drug.",
        source:
          "https://www.fda.gov/inspections-compliance-enforcement-and-criminal-investigations/warning-letters/nuscience-peptides-llc-733652-08242026",
      },
    ],
    sources: [
      "https://caminostrategygroup.com/resources/retatrutide",
      "https://www.fda.gov/inspections-compliance-enforcement-and-criminal-investigations/warning-letters/gram-peptides-721806-03312026",
      "https://www.fda.gov/inspections-compliance-enforcement-and-criminal-investigations/warning-letters/nuscience-peptides-llc-733652-08242026",
    ],
  },
  {
    slug: "tirzepatide",
    name: "Tirzepatide",
    category: "GLP-1",
    description:
      "A first-in-class dual receptor agonist that activates both GIP (glucose-dependent insulinotropic polypeptide) and GLP-1 hormone receptors, approved as Mounjaro (T2D) and Zepbound (obesity). Drives significant weight loss and glycemic control. Shortage-based compounding exception ended February 2025.",
    status: "contested",
    statusNote:
      "Shortage-based compounding exception ended Feb 18, 2025. Some 503A pharmacies (e.g. Red Rock Pharmacy) continue compounding by adding an ingredient such as glycine, arguing the resulting product is not 'essentially a copy' of the approved drug. This legal theory is unsettled — a May 2025 court ruling upheld the shortage-list removal, and FDA has proposed permanently excluding tirzepatide from the 503B bulk substances list.",
    lastChanged: "2026-08-14",
    shortageListHistory: "Removed from FDA shortage list December 2024.",
    enforcement: [
      {
        date: "2026-08-24",
        summary:
          "FDA warning letters to five online vendors (Peak Performance Peptides, Royal Peptides, NuScience Peptides, Peptide Partners, TXP Innovations) for unapproved-drug sales; FDA applied a 'net impression' standard rejecting RUO labels as a shield.",
        source:
          "https://www.afslaw.com/perspectives/alerts/ruo-ined-five-peptide-vendors-learn-research-use-only-not-legal-strategy",
      },
    ],
    sources: [
      "https://www.pharmacytimes.com/view/fda-moves-to-permanently-close-the-door-on-compounded-glp-1s",
      "https://www.seekpeptides.com/blog/articles/red-rock-pharmacy-tirzepatide-complete-guide",
      "https://www.doctronic.ai/blog/peptides-compounding-pharmacy-2026/",
    ],
  },
  {
    slug: "semaglutide",
    name: "Semaglutide",
    category: "GLP-1",
    description:
      "A glucagon-like peptide-1 (GLP-1) receptor agonist medication used to treat type 2 diabetes, manage chronic weight, and lower the risk of major heart and kidney events. Approved as Ozempic (T2D) and Wegovy (obesity). One of the most widely prescribed weight-loss drugs. Shortage resolved February 2025, ending most compounding exceptions.",
    status: "contested",
    statusNote:
      "Shortage resolved Feb 2025, ending the compounding exception for most pharmacies. FDA proposed (Apr 30, 2026) permanently excluding semaglutide from the 503B bulk substances list; the comment period, originally set to close June 29, 2026, was extended 30 days to July 30, 2026, and FDA has not issued a final rule as of this writing. Some pharmacies continue compounding under differentiated-formulation theories similar to tirzepatide.",
    lastChanged: "2026-10-19",
    shortageListHistory: "Removed from FDA shortage list February 2025.",
    enforcement: [
      {
        date: "2026-08-24",
        summary:
          "FDA warning letters to five online vendors (Peak Performance Peptides, Royal Peptides, NuScience Peptides, Peptide Partners, TXP Innovations) named semaglutide-labeled research peptides (e.g. NuScience's 'GLP-1 Sema Research Peptide') as unapproved new drugs.",
        source:
          "https://www.fda.gov/inspections-compliance-enforcement-and-criminal-investigations/warning-letters/nuscience-peptides-llc-733652-08242026",
      },
    ],
    sources: [
      "https://www.pharmacytimes.com/view/fda-moves-to-permanently-close-the-door-on-compounded-glp-1s",
      "https://www.doctronic.ai/blog/peptides-compounding-pharmacy-2026/",
      "https://www.federalregister.gov/documents/2026/06/26/2026-12937/list-of-bulk-drug-substances-for-which-there-is-a-clinical-need-under-section-503b-of-the-federal",
      "https://www.fda.gov/inspections-compliance-enforcement-and-criminal-investigations/warning-letters/nuscience-peptides-llc-733652-08242026",
    ],
  },
  {
    slug: "liraglutide",
    name: "Liraglutide",
    category: "GLP-1",
    description:
      "A GLP-1 receptor agonist approved as Victoza (T2D) and Saxenda (obesity). Older than semaglutide with a shorter half-life requiring daily injection. Proposed for permanent exclusion from the 503B bulk substances list.",
    status: "restricted",
    statusNote:
      "Named alongside semaglutide and tirzepatide in FDA's proposed (Apr 30, 2026) permanent exclusion from the 503B outsourcing-facility bulk substances list. The comment period, originally set to close June 29, 2026, was extended 30 days to July 30, 2026, and FDA has not issued a final rule as of this writing.",
    lastChanged: "2026-10-19",
    enforcement: [],
    sources: [
      "https://www.pharmacytimes.com/view/fda-moves-to-permanently-close-the-door-on-compounded-glp-1s",
      "https://www.federalregister.gov/documents/2026/06/26/2026-12937/list-of-bulk-drug-substances-for-which-there-is-a-clinical-need-under-section-503b-of-the-federal",
    ],
  },
  {
    slug: "bpc-157",
    name: "BPC-157",
    category: "Tissue Repair",
    description:
      "Body Protection Compound-157 — a synthetic 15-amino-acid peptide derived from a gastric protein. Studied in animal models for tendon, muscle, and GI repair. No human clinical trials completed; not FDA-approved.",
    status: "restricted",
    statusNote:
      "On the restricted bulk substances list — not eligible for 503A compounding. Frequently sold RUO despite this; FDA treats RUO labeling as immaterial when site context (dosing guidance, health claims) implies human use. FDA withdrew BPC-157 from its interim Category 2 safety-risk list in April 2026 after the nomination was withdrawn, and on July 23, 2026 FDA's Pharmacy Compounding Advisory Committee voted to recommend adding BPC-157 to the 503A Bulks List over FDA staff's own objection. The vote is advisory only — FDA has not added BPC-157 to the 503A Bulks List or issued a final rule as of this writing, so its compounding eligibility remains unsettled.",
    lastChanged: "2026-10-19",
    enforcement: [],
    sources: [
      "https://www.doctronic.ai/blog/peptide-fda-status-tracker/",
      "https://www.fda.gov/drugs/human-drug-compounding/certain-bulk-drug-substances-use-compounding-may-present-significant-safety-risks",
      "https://www.fda.gov/advisory-committees/advisory-committee-calendar/july-23-24-2026-meeting-pharmacy-compounding-advisory-committee-07232026",
      "https://www.bipc.com/fda-voted-yes-on-six-peptides-now-what-the-regulatory-road-ahead",
    ],
  },
  {
    slug: "tb-500",
    name: "TB-500 (Thymosin Beta-4)",
    category: "Tissue Repair",
    description:
      "A synthetic fragment of Thymosin Beta-4, a protein involved in actin regulation and tissue repair. Animal studies suggest wound-healing and anti-inflammatory effects. Not FDA-approved; no completed human clinical trials.",
    status: "restricted",
    statusNote:
      "On the restricted bulk substances list — not eligible for 503A compounding. FDA withdrew TB-500 (Thymosin Beta-4 fragment) from its interim Category 2 safety-risk list in April 2026 after the nomination was withdrawn, and on July 23, 2026 FDA's Pharmacy Compounding Advisory Committee voted to recommend adding TB-500 to the 503A Bulks List over FDA staff's own objection. The vote is advisory only — FDA has not added TB-500 to the 503A Bulks List or issued a final rule as of this writing, so its compounding eligibility remains unsettled.",
    lastChanged: "2026-10-19",
    enforcement: [],
    sources: [
      "https://www.doctronic.ai/blog/peptide-fda-status-tracker/",
      "https://www.fda.gov/drugs/human-drug-compounding/certain-bulk-drug-substances-use-compounding-may-present-significant-safety-risks",
      "https://www.fda.gov/advisory-committees/advisory-committee-calendar/july-23-24-2026-meeting-pharmacy-compounding-advisory-committee-07232026",
      "https://www.bipc.com/fda-voted-yes-on-six-peptides-now-what-the-regulatory-road-ahead",
    ],
  },
  {
    slug: "cjc-1295",
    name: "CJC-1295",
    category: "GH Secretagogue",
    description:
      "A synthetic analog of growth hormone-releasing hormone (GHRH) with an extended half-life due to a drug affinity complex (DAC) modification. Stimulates pituitary GH release. Not FDA-approved; no marketed drug form exists.",
    status: "restricted",
    statusNote:
      "Not on the permitted 503A bulk substances list — effectively prohibited from compounding. FDA withdrew CJC-1295 from its interim Category 2 safety-risk list in April 2026 after the nomination was withdrawn. It is not yet on the 503A Bulks List and has not been scheduled for Pharmacy Compounding Advisory Committee review, leaving it in an unsettled middle ground — no longer flagged as a significant safety risk, but still not affirmatively authorized for compounding.",
    lastChanged: "2026-10-19",
    enforcement: [],
    sources: [
      "https://www.doctronic.ai/blog/peptide-fda-status-tracker/",
      "https://www.fda.gov/drugs/human-drug-compounding/certain-bulk-drug-substances-use-compounding-may-present-significant-safety-risks",
    ],
  },
  {
    slug: "ipamorelin",
    name: "Ipamorelin",
    category: "GH Secretagogue",
    description:
      "A selective growth hormone secretagogue and ghrelin receptor agonist. Stimulates GH release with reportedly fewer side effects (cortisol, prolactin) than older secretagogues. Not FDA-approved; often compounded alongside CJC-1295.",
    status: "restricted",
    statusNote:
      "Not on the permitted 503A bulk substances list — effectively prohibited from compounding. FDA withdrew ipamorelin acetate from its interim Category 2 safety-risk list in April 2026 after the nomination was withdrawn (it remains separately listed in Category 2 under the 503B interim policy). It is not yet on the 503A Bulks List and has not been scheduled for Pharmacy Compounding Advisory Committee review, leaving it in an unsettled middle ground — no longer flagged as a significant safety risk under 503A, but still not affirmatively authorized for compounding.",
    lastChanged: "2026-10-19",
    enforcement: [
      {
        date: "2026-08-24",
        summary:
          "FDA warning letter to NuScience Peptides LLC named a 'Tesamorelin Ipamorelin Blend' product sold on its website as an unapproved new drug, part of a same-day batch of warning letters to five online peptide vendors.",
        source:
          "https://www.fda.gov/inspections-compliance-enforcement-and-criminal-investigations/warning-letters/nuscience-peptides-llc-733652-08242026",
      },
    ],
    sources: [
      "https://www.doctronic.ai/blog/peptide-fda-status-tracker/",
      "https://www.fda.gov/drugs/human-drug-compounding/certain-bulk-drug-substances-use-compounding-may-present-significant-safety-risks",
      "https://www.fda.gov/inspections-compliance-enforcement-and-criminal-investigations/warning-letters/nuscience-peptides-llc-733652-08242026",
    ],
  },
  {
    slug: "sermorelin",
    name: "Sermorelin",
    category: "GH Secretagogue",
    description:
      "A synthetic 29-amino-acid peptide analog of human growth hormone-releasing hormone (GHRH) that acts as a growth hormone secretagogue, stimulating the pituitary gland to produce and release natural (endogenous) HGH. Supports lean muscle mass and strength, aids reduction of visceral/abdominal fat, improves sleep quality and daytime energy, and enhances recovery from exercise, injury, or surgery. Previously FDA-approved as Geref (withdrawn for commercial reasons, not safety). Remains on the 503A permitted bulk substances list — one of the few GH secretagogues with a legal compounding pathway.",
    status: "compoundable",
    statusNote: "Permitted under 503A with a valid, patient-specific prescription.",
    lastChanged: "2026-01-01",
    enforcement: [],
    sources: ["https://www.doctronic.ai/blog/peptide-fda-status-tracker/"],
  },
  {
    slug: "oxytocin",
    name: "Oxytocin",
    category: "Hormone",
    description:
      'Often nicknamed the "love hormone" or "cuddle hormone," this endogenous nonapeptide is involved in trust, romantic attachment, and sexual arousal. Assists in sperm transport and testosterone production in males, and peaks around orgasm for both men and women. Can help lower cortisol levels and reduce feelings of anxiety, and as a natural vasodilator may help relax blood vessels and reduce cardiovascular stress. FDA-approved as Pitocin for obstetric use. Compounding pharmacies prepare intranasal, sublingual, and topical forms for conditions such as social anxiety and postpartum support where the approved IV formulation is impractical.',
    status: "compoundable",
    statusNote: "Permitted under 503A with documented need and a valid prescription.",
    lastChanged: "2026-01-01",
    enforcement: [],
    sources: ["https://www.doctronic.ai/blog/peptide-fda-status-tracker/"],
  },
  {
    slug: "pt-141",
    name: "PT-141 (Bremelanotide)",
    category: "Sexual Health",
    description:
      "A synthetic melanocortin receptor agonist peptide that acts centrally on the brain to stimulate sexual desire and arousal. FDA-approved as Vyleesi for hypoactive sexual desire disorder (HSDD) in premenopausal women. Unlike PDE5 inhibitors (Viagra, Cialis) that work peripherally to increase blood flow, PT-141 acts on melanocortin receptors (primarily MC4R) in the hypothalamus and central nervous system, triggering natural pathways involved in sexual motivation, desire, and dopamine release. Compounding is tightly restricted because an approved drug already exists.",
    status: "fda-approved",
    statusNote:
      "FDA-approved (Vyleesi) — compounding is restricted to narrow 503A/503B carve-outs (e.g. a medically necessary dosage-form or strength change for an individual patient), not open compounding of the approved drug.",
    lastChanged: "2026-10-19",
    enforcement: [
      {
        date: "2026-08-24",
        summary:
          "FDA warning letter to NuScience Peptides LLC (part of a same-day batch of letters to five online peptide vendors) named 'PT-141 Peptide (Bremelanotide)' as an unapproved new drug sold outside its approved Vyleesi channel.",
        source:
          "https://www.fda.gov/inspections-compliance-enforcement-and-criminal-investigations/warning-letters/nuscience-peptides-llc-733652-08242026",
      },
    ],
    sources: [
      "https://www.doctronic.ai/blog/peptides-compounding-pharmacy-2026/",
      "https://www.fda.gov/inspections-compliance-enforcement-and-criminal-investigations/warning-letters/nuscience-peptides-llc-733652-08242026",
    ],
  },
  {
    slug: "ghk-cu",
    name: "GHK-Cu (Copper Peptide)",
    category: "Cosmetic / Tissue Repair",
    description:
      "A naturally occurring copper-binding tripeptide (Gly-His-Lys) studied for skin repair, collagen stimulation, and anti-inflammatory effects. Widely used in topical cosmetics. Injectable preparations have no FDA approval or legal compounding pathway.",
    status: "restricted",
    statusNote:
      "Not on the FDA permitted 503A bulk substances list. Widely sold as a topical cosmetic ingredient, but compounding for injectable or systemic use has no established legal pathway. FDA treats injectable preparations as subject to drug-compounding rules regardless of cosmetic marketing. FDA withdrew injectable GHK-Cu from its interim Category 2 safety-risk list in April 2026 after the nomination was withdrawn. It is not yet on the 503A Bulks List and has not been scheduled for Pharmacy Compounding Advisory Committee review.",
    lastChanged: "2026-10-19",
    enforcement: [],
    sources: [
      "https://www.doctronic.ai/blog/peptide-fda-status-tracker/",
      "https://www.fda.gov/drugs/human-drug-compounding/certain-bulk-drug-substances-use-compounding-may-present-significant-safety-risks",
    ],
  },
  {
    slug: "epithalon",
    name: "Epithalon",
    category: "Bioregulator",
    description:
      "A synthetic tetrapeptide (Ala-Glu-Asp-Gly) derived from the pineal gland, studied in Russian research for lengthening telomeres (the protective caps on the ends of chromosomes) and activating telomerase, the enzyme that rebuilds them — theoretically slowing cellular aging. Also claimed to normalize sleep cycles and restore youthful melatonin production. No FDA-approved form exists and it has never appeared on a shortage list — there is no legal compounding pathway.",
    status: "no-pathway",
    statusNote:
      "Not FDA-approved and not on any drug shortage list. No 503A or 503B compounding pathway exists. Frequently sold RUO; FDA has consistently rejected RUO labels as a defense where human-use intent is evident from site context or dosing instructions. FDA withdrew epitalon (its FDA-listed spelling) from its interim Category 2 safety-risk list in April 2026 after the nomination was withdrawn, and on July 24, 2026 FDA's Pharmacy Compounding Advisory Committee voted to recommend adding it to the 503A Bulks List. The vote is advisory only — FDA has not added it to the 503A Bulks List or issued a final rule as of this writing, so its compounding eligibility remains unsettled.",
    lastChanged: "2026-10-19",
    enforcement: [],
    sources: [
      "https://www.doctronic.ai/blog/peptide-fda-status-tracker/",
      "https://www.fda.gov/drugs/human-drug-compounding/certain-bulk-drug-substances-use-compounding-may-present-significant-safety-risks",
      "https://www.fda.gov/advisory-committees/advisory-committee-calendar/july-23-24-2026-meeting-pharmacy-compounding-advisory-committee-07232026",
      "https://www.bipc.com/fda-voted-yes-on-six-peptides-now-what-the-regulatory-road-ahead",
    ],
  },
  {
    slug: "nad-plus",
    name: "NAD+ (Nicotinamide Adenine Dinucleotide)",
    category: "Metabolic / Anti-Aging",
    description:
      "A coenzyme central to cellular energy metabolism and DNA repair, declining with age. Administered IV or subcutaneously to raise systemic NAD+ levels. On the FDA 503A permitted bulk substances list; IV infusion compounding is common at longevity and wellness clinics.",
    status: "compoundable",
    statusNote:
      "Permitted under 503A with a valid patient-specific prescription. IV formulations must be prepared under USP 797 sterile-compounding standards.",
    lastChanged: "2026-01-01",
    enforcement: [],
    sources: ["https://www.doctronic.ai/blog/peptide-fda-status-tracker/"],
  },
  {
    slug: "hcg",
    name: "HCG (Human Chorionic Gonadotropin)",
    category: "Hormone",
    description:
      "A glycoprotein hormone produced during pregnancy that mimics LH, stimulating testosterone production in men. Used off-label for male hypogonadism, fertility, and post-cycle recovery. FDA approved several injectable forms; compounded HCG for weight-loss (HCG diet) is banned.",
    status: "fda-approved",
    statusNote:
      "FDA-approved injectables (Novarel, Pregnyl) exist. FDA banned compounded HCG for the 'HCG diet' in 2020. Compounding for documented fertility or hypogonadism indications may still qualify under narrow 503A carve-outs with a valid Rx.",
    lastChanged: "2026-01-01",
    enforcement: [
      {
        date: "2020-12-01",
        summary:
          "FDA prohibited compounded HCG products marketed for weight loss, citing no substantial clinical evidence and existing approved alternatives.",
        source:
          "https://www.fda.gov/drugs/human-drug-compounding/compounding-and-fda-questions-and-answers",
      },
    ],
    sources: [
      "https://www.fda.gov/drugs/human-drug-compounding/compounding-and-fda-questions-and-answers",
    ],
  },
  {
    slug: "aod-9604",
    name: "AOD-9604",
    category: "Weight Loss / Metabolic",
    description:
      "A modified fragment of human growth hormone (HGH 176-191) designed to stimulate fat metabolism without the insulin-like effects of full HGH. Never FDA-approved; a failed Phase 3 trial for obesity led the developer to pivot to joint-health indications. No legal compounding pathway.",
    status: "no-pathway",
    statusNote:
      "Not FDA-approved and not on any shortage list. No 503A or 503B pathway exists. Frequently sold RUO alongside other peptide weight-loss compounds. FDA withdrew AOD-9604 from its interim Category 2 safety-risk list in April 2026 after the nomination was withdrawn. It is not yet on the 503A Bulks List and has not been scheduled for Pharmacy Compounding Advisory Committee review.",
    lastChanged: "2026-10-19",
    enforcement: [],
    sources: [
      "https://www.doctronic.ai/blog/peptide-fda-status-tracker/",
      "https://www.fda.gov/drugs/human-drug-compounding/certain-bulk-drug-substances-use-compounding-may-present-significant-safety-risks",
    ],
  },
  {
    slug: "thymosin-alpha-1",
    name: "Thymosin Alpha-1",
    category: "Immune Modulator",
    description:
      "A 28-amino-acid thymic peptide that modulates T-cell function and innate immunity. FDA-approved as Zadaxin in dozens of countries for hepatitis B/C and as an immune adjuvant, but NOT approved in the United States. Used off-label in the US for immune dysfunction, Lyme disease, and long COVID.",
    status: "restricted",
    statusNote:
      "Not FDA-approved in the US. Not on the 503A permitted bulk substances list. Some compounding pharmacies prepare it under a restricted-use interpretation; regulatory status is contested and subject to FDA discretion. FDA withdrew thymosin-alpha 1 from its interim Category 2 safety-risk list in April 2026 after the nomination was withdrawn. It is not yet on the 503A Bulks List and has not been scheduled for Pharmacy Compounding Advisory Committee review.",
    lastChanged: "2026-10-19",
    enforcement: [],
    sources: [
      "https://www.doctronic.ai/blog/peptide-fda-status-tracker/",
      "https://www.fda.gov/drugs/human-drug-compounding/certain-bulk-drug-substances-use-compounding-may-present-significant-safety-risks",
    ],
  },
  {
    slug: "tesamorelin",
    name: "Tesamorelin",
    category: "GH Secretagogue",
    description:
      "A GHRH analog that specifically promotes the breakdown (lipolysis) of visceral adipose tissue — the deep abdominal fat surrounding internal organs. Not a general weight-loss drug; clinical trials show it significantly shrinks waistlines and visceral fat without causing major changes in overall body weight.",
    status: "fda-approved",
    statusNote:
      "FDA-approved as Egrifta for HIV-associated lipodystrophy. Compounding for off-label indications (e.g. general visceral-fat reduction) falls outside the approved use and is restricted to narrow 503A/503B carve-outs with a valid patient-specific prescription.",
    lastChanged: "2026-10-19",
    enforcement: [
      {
        date: "2026-08-24",
        summary:
          "FDA warning letter to NuScience Peptides LLC (part of a same-day batch of letters to five online peptide vendors) named 'Tesamorelin Research Peptide' and a 'Tesamorelin Ipamorelin Blend' product as unapproved new drugs sold outside Tesamorelin's approved Egrifta indication.",
        source:
          "https://www.fda.gov/inspections-compliance-enforcement-and-criminal-investigations/warning-letters/nuscience-peptides-llc-733652-08242026",
      },
    ],
    sources: [
      "https://www.doctronic.ai/blog/peptide-fda-status-tracker/",
      "https://www.fda.gov/inspections-compliance-enforcement-and-criminal-investigations/warning-letters/nuscience-peptides-llc-733652-08242026",
    ],
  },
  {
    slug: "mots-c",
    name: "MOTS-c",
    category: "Metabolic / Mitochondrial Peptide",
    description:
      "A mitochondrial-derived peptide that activates the AMPK pathway (the cell's fuel gauge) and disrupts the folate-methionine cycle to mimic the effects of exercise and metabolic stress. Natural levels of MOTS-c decrease with age and lack of physical activity.",
    status: "no-pathway",
    statusNote:
      "Not FDA-approved and not on any drug shortage list. No 503A or 503B compounding pathway exists. Sold almost exclusively RUO; FDA has rejected RUO labeling as a defense where dosing instructions or marketing imply human use. FDA withdrew MOTS-c from its interim Category 2 safety-risk list in April 2026 after the nomination was withdrawn, and on July 23, 2026 FDA's Pharmacy Compounding Advisory Committee voted to recommend adding it to the 503A Bulks List. The vote is advisory only — FDA has not added it to the 503A Bulks List or issued a final rule as of this writing, so its compounding eligibility remains unsettled.",
    lastChanged: "2026-10-19",
    enforcement: [],
    sources: [
      "https://www.doctronic.ai/blog/peptide-fda-status-tracker/",
      "https://www.fda.gov/drugs/human-drug-compounding/certain-bulk-drug-substances-use-compounding-may-present-significant-safety-risks",
      "https://www.fda.gov/advisory-committees/advisory-committee-calendar/july-23-24-2026-meeting-pharmacy-compounding-advisory-committee-07232026",
      "https://www.bipc.com/fda-voted-yes-on-six-peptides-now-what-the-regulatory-road-ahead",
    ],
  },
  {
    slug: "semax",
    name: "Semax",
    category: "Nootropic",
    description:
      'A synthetic peptide that influences the brain\'s dopaminergic and serotonergic pathways, helping regulate dopamine and serotonin metabolism to support focus, motivation, and mood balance. Explored in nootropic communities and research settings for enhanced focus and attention, memory and learning support, stress resilience and mood support, and neuroprotection — often to combat mental fatigue, "brain fog," or periods requiring heavy intellectual output.',
    status: "no-pathway",
    statusNote:
      "Not FDA-approved in the US (approved as a prescription drug in Russia) and has no US drug shortage listing. No 503A or 503B compounding pathway. Available in the US primarily through RUO and grey-market vendors. FDA withdrew Semax from its interim Category 2 safety-risk list in April 2026 after the nomination was withdrawn, and on July 24, 2026 FDA's Pharmacy Compounding Advisory Committee voted to recommend adding it to the 503A Bulks List. The vote is advisory only — FDA has not added it to the 503A Bulks List or issued a final rule as of this writing, so its compounding eligibility remains unsettled.",
    lastChanged: "2026-10-19",
    enforcement: [],
    sources: [
      "https://www.doctronic.ai/blog/peptide-fda-status-tracker/",
      "https://www.fda.gov/drugs/human-drug-compounding/certain-bulk-drug-substances-use-compounding-may-present-significant-safety-risks",
      "https://www.fda.gov/advisory-committees/advisory-committee-calendar/july-23-24-2026-meeting-pharmacy-compounding-advisory-committee-07232026",
      "https://www.bipc.com/fda-voted-yes-on-six-peptides-now-what-the-regulatory-road-ahead",
    ],
  },
  {
    slug: "selank",
    name: "Selank",
    category: "Nootropic / Anxiolytic",
    description:
      "A synthetic heptapeptide analog of tuftsin developed by the Russian Institute of Molecular Genetics. Studied for anxiolytic and nootropic effects without the sedation of benzodiazepines. Not FDA-approved; no US clinical trials; no compounding pathway exists.",
    status: "no-pathway",
    statusNote:
      "Not FDA-approved and has no US drug shortage listing. No 503A or 503B compounding pathway. Primarily available through RUO and grey-market vendors in the US. FDA withdrew selank acetate from its interim Category 2 safety-risk list in April 2026 after the nomination was withdrawn. It is not yet on the 503A Bulks List and has not been scheduled for Pharmacy Compounding Advisory Committee review.",
    lastChanged: "2026-10-19",
    enforcement: [],
    sources: [
      "https://www.doctronic.ai/blog/peptide-fda-status-tracker/",
      "https://www.fda.gov/drugs/human-drug-compounding/certain-bulk-drug-substances-use-compounding-may-present-significant-safety-risks",
    ],
  },
];
