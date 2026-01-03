"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";

export default function EditCustomerPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const router = useRouter();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
const [companyName, setCompanyName] = useState("");
const [companyAddress, setCompanyAddress] = useState("");
const [companyEik, setCompanyEik] = useState("");
const [vatNumber, setVatNumber] = useState("");
const [companyMol, setCompanyMol] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      setError(null);
      setLoading(true);

      const { data, error } = await supabase
        .from("customers")
.select("name,phone,email,company_name,company_address,company_eik,vat_number,company_mol")
        .eq("id", id)
        .single();

      setLoading(false);

      if (error) return setError(error.message);

      setName(data.name ?? "");
      setPhone(data.phone ?? "");
      setEmail(data.email ?? "");
	  setCompanyName(data.company_name ?? "");
setCompanyAddress(data.company_address ?? "");
setCompanyEik(data.company_eik ?? "");
setVatNumber(data.vat_number ?? "");
setCompanyMol(data.company_mol ?? "");
    })();
  }, [id]);

async function save(e: React.FormEvent) {
  e.preventDefault();
  setError(null);
  setSaving(true);

  const { error } = await supabase
    .from("customers")
    .update({
      name: name.trim(),
      phone: phone.trim() || null,
      email: email.trim() || null,

      company_name: companyName.trim() || null,
      company_address: companyAddress.trim() || null,
      company_eik: companyEik.trim() || null,
      vat_number: vatNumber.trim() || null,
      company_mol: companyMol.trim() || null,
    })
    .eq("id", id);

  setSaving(false);

  if (error) {
    setError(error.message);
    return;
  }

  router.push(`/customers/${id}`);
}

  if (loading) return <div style={{ padding: 20 }}>Зареждане...</div>;

  return (
    <div style={{ maxWidth: 520, padding: 20 }}>
      <h1 style={{ marginTop: 0 }}>Редакция клиент</h1>

      <form onSubmit={save} style={{ display: "grid", gap: 12 }}>
        <label>
          Име *
          <input value={name} onChange={(e) => setName(e.target.value)} required style={{ width: "100%", padding: 10 }} />
        </label>

        <label>
          Телефон
          <input value={phone} onChange={(e) => setPhone(e.target.value)} style={{ width: "100%", padding: 10 }} />
        </label>

        <label>
          Email
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} style={{ width: "100%", padding: 10 }} />
        </label>

        {error && <div style={{ color: "crimson" }}>{error}</div>}

        <div style={{ display: "flex", gap: 10 }}>
          <button disabled={saving} style={{ padding: 12 }}>
            {saving ? "Запис..." : "Запази"}
          </button>
          <button type="button" onClick={() => router.push(`/customers/${id}`)} style={{ padding: 12 }}>
            Отказ
          </button>
        </div>
      </form>
    </div>
  );
}
