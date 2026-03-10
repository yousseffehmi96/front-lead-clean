export default function StatCard({ title, value, color }: { title: string, value: number, color: string }) {
  return (
    <div className={`p-6 rounded-xl shadow flex flex-col items-center justify-center ${color}`}>
      <h4 className="text-gray-700 font-medium text-lg mb-2">{title}</h4>
      <span className="text-2xl font-bold text-gray-900">{value}</span>
    </div>
  )
}