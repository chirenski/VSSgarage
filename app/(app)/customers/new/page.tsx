"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";

export default function NewCustomerPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
const [companyName, setCompanyName] = useState("");
const [companyAddress, setCompanyAddress] = useState("");
const [companyEik, setCompanyEik] = useState("");
const [vatNumber, setVatNumber] = useState("");
const [companyMol, setCompanyMol] = useState("");
  async function save(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError("Името е задължително.");
      return;
    }

    setSaving(true);

    const { error } = await supabase.from("customers").insert({
      name: name.trim(),
      phone: phone.trim() || null,
      email: email.trim() || null,
	  company_name: companyName.trim() || null,
	company_address: companyAddress.trim() || null,
  company_eik: companyEik.trim() || null,
  vat_number: vatNumber.trim() || null,
  company_mol: companyMol.trim() || null,
    });

    setSaving(false);

    if (error) {
      setError(error.message);
      return;
    }

    router.push("/customers");
  }

  return (
    <div style={{ maxWidth: 500, padding: 20 }}>
      <h1>Нов клиент</h1>

      <form onSubmit={save} style={{ display: "grid", gap: 12 }}>
        <label>
          Име *
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            style={{ width: "100%", padding: 10 }}
          />
        </label>

        <label>
          Телефон
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            style={{ width: "100%", padding: 10 }}
          />
        </label>

        <label>
          Email
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{ width: "100%", padding: 10 }}
          />
        </label>
		
		<hr />

<h3>Фирмени данни (по желание)</h3>

<label>
  Име на фирма
  <input value={companyName} onChange={(e) => setCompanyName(e.target.value)} />
</label>

<label>
  Адрес на фирма
  <input value={companyAddress} onChange={(e) => setCompanyAddress(e.target.value)} />
</label>

<label>
  ЕИК / БУЛСТАТ
  <input value={companyEik} onChange={(e) => setCompanyEik(e.target.value)} />
</label>

<label>
  ИН по ЗДДС
  <input value={vatNumber} onChange={(e) => setVatNumber(e.target.value)} />
</label>

<label>
  МОЛ
  <input value={companyMol} onChange={(e) => setCompanyMol(e.target.value)} />
</label>

        {error && <div style={{ color: "crimson" }}>{error}</div>}

        <button disabled={saving} style={{ padding: 12 }}>
          {saving ? "Запис..." : "Запази"}
        </button>
      </form>
    </div>
  );
}
