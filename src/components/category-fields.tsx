"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Props {
  category: string;
  specs: Record<string, string>;
  onChange: (specs: Record<string, string>) => void;
}

const COLORS = ["Black","White","Red","Blue","Green","Yellow","Pink","Purple","Orange","Brown","Grey","Navy","Maroon","Beige","Gold","Silver"];
const SIZES_CLOTHING = ["XS","S","M","L","XL","XXL","3XL"];
const SIZES_SHOES = ["5","6","7","8","9","10","11","12"];
const GENDERS = ["Men","Women","Kids","Unisex"];
const OCCASIONS = ["Casual","Formal","Party","Sports","Traditional","Work"];
const SKIN_TYPES = ["Dry","Oily","Normal","Combination","Sensitive","All"];
const WARRANTIES = ["No Warranty","6 Months","1 Year","2 Years","3 Years"];
const TOY_AGES = ["0-2 years","3-5 years","6-8 years","9-12 years","13+ years"];
const LANGUAGES = ["English","Hindi","Tamil","Telugu","Kannada","Malayalam","Bengali","Marathi","Gujarati","Other"];
const SPORTS = ["Cricket","Football","Basketball","Tennis","Badminton","Swimming","Running","Gym & Fitness","Cycling","Other"];

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <Label className="text-sm font-medium text-gray-700">{label}</Label>
      <div className="mt-1.5">{children}</div>
    </div>
  );
}

function TextInput({ label, field, placeholder, specs, onChange }: { label: string; field: string; placeholder?: string; specs: Record<string, string>; onChange: (s: Record<string, string>) => void }) {
  return (
    <Field label={label}>
      <Input placeholder={placeholder} value={specs[field] || ""} onChange={(e) => onChange({ ...specs, [field]: e.target.value })} />
    </Field>
  );
}

function SelectInput({ label, field, options, specs, onChange }: { label: string; field: string; options: string[]; specs: Record<string, string>; onChange: (s: Record<string, string>) => void }) {
  return (
    <Field label={label}>
      <select
        className="w-full border border-input rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#0d9488]/40"
        value={specs[field] || ""}
        onChange={(e) => onChange({ ...specs, [field]: e.target.value })}
      >
        <option value="">Select {label}</option>
        {options.map((o) => <option key={o}>{o}</option>)}
      </select>
    </Field>
  );
}

function MultiToggle({ label, field, options, specs, onChange, colored }: { label: string; field: string; options: string[]; specs: Record<string, string>; onChange: (s: Record<string, string>) => void; colored?: boolean }) {
  const selected = specs[field] ? specs[field].split(",").map((s) => s.trim()) : [];
  const toggle = (opt: string) => {
    const next = selected.includes(opt) ? selected.filter((s) => s !== opt) : [...selected, opt];
    onChange({ ...specs, [field]: next.join(", ") });
  };
  return (
    <Field label={label}>
      <div className="flex flex-wrap gap-1.5">
        {options.map((opt) => {
          const active = selected.includes(opt);
          if (colored) {
            const colorMap: Record<string, string> = {
              Black: "bg-black", White: "bg-white border-gray-300", Red: "bg-red-500", Blue: "bg-blue-500",
              Green: "bg-green-500", Yellow: "bg-yellow-400", Pink: "bg-pink-400", Purple: "bg-purple-500",
              Orange: "bg-orange-400", Brown: "bg-amber-800", Grey: "bg-gray-400", Navy: "bg-blue-900",
              Maroon: "bg-red-900", Beige: "bg-amber-100 border-gray-300", Gold: "bg-yellow-500", Silver: "bg-gray-300",
            };
            return (
              <button key={opt} type="button" onClick={() => toggle(opt)} title={opt}
                className={`w-7 h-7 rounded-full border-2 transition-all ${colorMap[opt] || "bg-gray-200"} ${active ? "border-[#0d9488] scale-110 ring-2 ring-[#0d9488]/30" : "border-transparent"}`}
              />
            );
          }
          return (
            <button key={opt} type="button" onClick={() => toggle(opt)}
              className={`px-3 py-1 rounded-full text-xs font-medium border transition-all ${active ? "bg-[#0d9488] text-white border-[#0d9488]" : "bg-white text-gray-600 border-gray-300 hover:border-[#0d9488]"}`}
            >
              {opt}
            </button>
          );
        })}
      </div>
      {selected.length > 0 && <p className="text-xs text-gray-400 mt-1">Selected: {selected.join(", ")}</p>}
    </Field>
  );
}

export default function CategoryFields({ category, specs, onChange }: Props) {
  if (!category) return null;

  const sectionClass = "bg-gray-50 rounded-xl border border-gray-200 p-4 space-y-4";

  if (category === "Fashion") return (
    <div className={sectionClass}>
      <p className="text-sm font-semibold text-gray-800">👗 Fashion Details</p>
      <div className="grid grid-cols-2 gap-4">
        <SelectInput label="Gender" field="gender" options={GENDERS} specs={specs} onChange={onChange} />
        <TextInput label="Material / Fabric" field="material" placeholder="e.g. Cotton, Polyester" specs={specs} onChange={onChange} />
      </div>
      <MultiToggle label="Available Sizes" field="sizes" options={SIZES_CLOTHING} specs={specs} onChange={onChange} />
      <MultiToggle label="Available Colors" field="colors" options={COLORS} specs={specs} onChange={onChange} colored />
      <MultiToggle label="Occasion" field="occasion" options={OCCASIONS} specs={specs} onChange={onChange} />
      <TextInput label="Fabric Care Instructions" field="care" placeholder="e.g. Machine wash cold, Do not bleach" specs={specs} onChange={onChange} />
      <TextInput label="Country of Origin" field="origin" placeholder="e.g. India" specs={specs} onChange={onChange} />
    </div>
  );

  if (category === "Electronics") return (
    <div className={sectionClass}>
      <p className="text-sm font-semibold text-gray-800">⚡ Electronics Details</p>
      <div className="grid grid-cols-2 gap-4">
        <TextInput label="Brand" field="brand" placeholder="e.g. Samsung, Apple" specs={specs} onChange={onChange} />
        <TextInput label="Model Number" field="model" placeholder="e.g. SM-S918B" specs={specs} onChange={onChange} />
        <SelectInput label="Warranty" field="warranty" options={WARRANTIES} specs={specs} onChange={onChange} />
        <TextInput label="Color" field="color" placeholder="e.g. Phantom Black" specs={specs} onChange={onChange} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <TextInput label="Key Spec 1 (e.g. RAM)" field="spec1" placeholder="e.g. 12GB RAM" specs={specs} onChange={onChange} />
        <TextInput label="Key Spec 2 (e.g. Storage)" field="spec2" placeholder="e.g. 256GB Storage" specs={specs} onChange={onChange} />
        <TextInput label="Key Spec 3 (e.g. Display)" field="spec3" placeholder='e.g. 6.8" AMOLED' specs={specs} onChange={onChange} />
        <TextInput label="Key Spec 4 (e.g. Battery)" field="spec4" placeholder="e.g. 5000mAh" specs={specs} onChange={onChange} />
      </div>
      <TextInput label="In the Box" field="inbox" placeholder="e.g. Phone, Charger, Cable, Earphones" specs={specs} onChange={onChange} />
    </div>
  );

  if (category === "Books") return (
    <div className={sectionClass}>
      <p className="text-sm font-semibold text-gray-800">📚 Book Details</p>
      <div className="grid grid-cols-2 gap-4">
        <TextInput label="Author" field="author" placeholder="e.g. Chetan Bhagat" specs={specs} onChange={onChange} />
        <TextInput label="Publisher" field="publisher" placeholder="e.g. Penguin Books" specs={specs} onChange={onChange} />
        <TextInput label="ISBN" field="isbn" placeholder="e.g. 978-0143441243" specs={specs} onChange={onChange} />
        <TextInput label="Number of Pages" field="pages" placeholder="e.g. 320" specs={specs} onChange={onChange} />
        <SelectInput label="Language" field="language" options={LANGUAGES} specs={specs} onChange={onChange} />
        <TextInput label="Edition" field="edition" placeholder="e.g. 2nd Edition, 2023" specs={specs} onChange={onChange} />
      </div>
      <TextInput label="Genre / Subject" field="genre" placeholder="e.g. Fiction, Self-Help, Engineering" specs={specs} onChange={onChange} />
    </div>
  );

  if (category === "Beauty") return (
    <div className={sectionClass}>
      <p className="text-sm font-semibold text-gray-800">💄 Beauty Details</p>
      <div className="grid grid-cols-2 gap-4">
        <TextInput label="Brand" field="brand" placeholder="e.g. Lakme, Mamaearth" specs={specs} onChange={onChange} />
        <TextInput label="Net Weight / Volume" field="volume" placeholder="e.g. 200ml, 100g" specs={specs} onChange={onChange} />
        <SelectInput label="Suitable For" field="suitableFor" options={["Men","Women","All","Kids"]} specs={specs} onChange={onChange} />
        <TextInput label="Shade / Color" field="shade" placeholder="e.g. Nude Pink, Clear" specs={specs} onChange={onChange} />
      </div>
      <MultiToggle label="Skin Type" field="skinType" options={SKIN_TYPES} specs={specs} onChange={onChange} />
      <TextInput label="Key Ingredients" field="ingredients" placeholder="e.g. Aloe Vera, Vitamin C, Hyaluronic Acid" specs={specs} onChange={onChange} />
      <TextInput label="How to Use" field="howToUse" placeholder="e.g. Apply evenly on cleansed face" specs={specs} onChange={onChange} />
      <div className="grid grid-cols-2 gap-4">
        <TextInput label="Country of Origin" field="origin" placeholder="e.g. India" specs={specs} onChange={onChange} />
        <TextInput label="Expiry / Shelf Life" field="expiry" placeholder="e.g. 24 months from manufacture" specs={specs} onChange={onChange} />
      </div>
    </div>
  );

  if (category === "Sports") return (
    <div className={sectionClass}>
      <p className="text-sm font-semibold text-gray-800">🏏 Sports Details</p>
      <div className="grid grid-cols-2 gap-4">
        <TextInput label="Brand" field="brand" placeholder="e.g. Nike, Yonex, SG" specs={specs} onChange={onChange} />
        <SelectInput label="Sport / Activity" field="sport" options={SPORTS} specs={specs} onChange={onChange} />
        <TextInput label="Material" field="material" placeholder="e.g. Polyester, Rubber, Carbon" specs={specs} onChange={onChange} />
        <TextInput label="Weight" field="weight" placeholder="e.g. 500g, 1.2kg" specs={specs} onChange={onChange} />
      </div>
      <MultiToggle label="Available Sizes" field="sizes" options={["XS","S","M","L","XL","XXL","One Size","6","7","8","9","10"]} specs={specs} onChange={onChange} />
      <MultiToggle label="Available Colors" field="colors" options={COLORS} specs={specs} onChange={onChange} colored />
      <SelectInput label="Warranty" field="warranty" options={WARRANTIES} specs={specs} onChange={onChange} />
    </div>
  );

  if (category === "Home & Kitchen") return (
    <div className={sectionClass}>
      <p className="text-sm font-semibold text-gray-800">🏠 Home & Kitchen Details</p>
      <div className="grid grid-cols-2 gap-4">
        <TextInput label="Brand" field="brand" placeholder="e.g. Prestige, Philips" specs={specs} onChange={onChange} />
        <TextInput label="Material" field="material" placeholder="e.g. Stainless Steel, Plastic" specs={specs} onChange={onChange} />
        <TextInput label="Dimensions" field="dimensions" placeholder="e.g. 30 x 20 x 15 cm" specs={specs} onChange={onChange} />
        <TextInput label="Weight" field="weight" placeholder="e.g. 1.5kg" specs={specs} onChange={onChange} />
        <SelectInput label="Warranty" field="warranty" options={WARRANTIES} specs={specs} onChange={onChange} />
        <TextInput label="Power (if electrical)" field="power" placeholder="e.g. 750W, 1500W" specs={specs} onChange={onChange} />
      </div>
      <MultiToggle label="Available Colors" field="colors" options={COLORS} specs={specs} onChange={onChange} colored />
      <TextInput label="In the Box" field="inbox" placeholder="e.g. 1 Cooker, 1 Lid, 2 Gaskets" specs={specs} onChange={onChange} />
    </div>
  );

  if (category === "Toys") return (
    <div className={sectionClass}>
      <p className="text-sm font-semibold text-gray-800">🧸 Toy Details</p>
      <div className="grid grid-cols-2 gap-4">
        <TextInput label="Brand" field="brand" placeholder="e.g. Lego, Hot Wheels" specs={specs} onChange={onChange} />
        <SelectInput label="Recommended Age" field="ageGroup" options={TOY_AGES} specs={specs} onChange={onChange} />
        <TextInput label="Material" field="material" placeholder="e.g. ABS Plastic, Fabric" specs={specs} onChange={onChange} />
        <SelectInput label="Battery Required" field="battery" options={["No","Yes – AA","Yes – AAA","Yes – Rechargeable"]} specs={specs} onChange={onChange} />
      </div>
      <MultiToggle label="Available Colors" field="colors" options={COLORS} specs={specs} onChange={onChange} colored />
      <TextInput label="Safety Certifications" field="safety" placeholder="e.g. BIS Certified, Non-toxic" specs={specs} onChange={onChange} />
      <TextInput label="In the Box" field="inbox" placeholder="e.g. 1 Toy, 1 Manual, 1 Battery" specs={specs} onChange={onChange} />
    </div>
  );

  if (category === "Grocery") return (
    <div className={sectionClass}>
      <p className="text-sm font-semibold text-gray-800">🛒 Grocery Details</p>
      <div className="grid grid-cols-2 gap-4">
        <TextInput label="Brand" field="brand" placeholder="e.g. Tata, Amul, Patanjali" specs={specs} onChange={onChange} />
        <TextInput label="Net Weight / Volume" field="volume" placeholder="e.g. 500g, 1kg, 1L" specs={specs} onChange={onChange} />
        <SelectInput label="Type" field="vegType" options={["Vegetarian","Non-Vegetarian","Vegan","Jain"]} specs={specs} onChange={onChange} />
        <TextInput label="Shelf Life" field="shelfLife" placeholder="e.g. 6 months, 1 year" specs={specs} onChange={onChange} />
      </div>
      <TextInput label="Key Ingredients / Nutritional Info" field="ingredients" placeholder="e.g. Wheat flour, Sugar, Salt..." specs={specs} onChange={onChange} />
      <TextInput label="Storage Instructions" field="storage" placeholder="e.g. Store in cool dry place" specs={specs} onChange={onChange} />
      <TextInput label="Country of Origin" field="origin" placeholder="e.g. India" specs={specs} onChange={onChange} />
    </div>
  );

  return null;
}
