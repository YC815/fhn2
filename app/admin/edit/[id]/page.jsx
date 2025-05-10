"use client";
import AdminNewsEditor from "@/components/AdminNewsEditor";

export default async function EditNewsPage({ params }) {
    const data = await fetch(`/api/news/${params.id}`).then(res => res.json());
    return <AdminNewsEditor initialData={data} />;
}
