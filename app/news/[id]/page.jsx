// app/news/[id]/page.jsx
import AdminNewsEditor from "@/components/AdminNewsEditor";

export default async function EditNewsPage({ params }) {
    const res = await fetch(`http://localhost:3000/api/news/${params.id}`, {
        cache: "no-store", // 避免快取
    });
    const data = await res.json();

    return <AdminNewsEditor initialData={data} />;
}
