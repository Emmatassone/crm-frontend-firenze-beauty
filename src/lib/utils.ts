export const EMPLOYEE_COLORS = [
    'bg-blue-600',
    'bg-purple-600',
    'bg-teal-600',
    'bg-indigo-600',
    'bg-rose-600',
    'bg-emerald-600',
    'bg-cyan-600',
    'bg-violet-600',
    'bg-sky-600',
    'bg-fuchsia-600',
];

export const getEmployeeColor = (employeeId?: string | number) => {
    if (!employeeId) return 'bg-pink-600';
    const idStr = String(employeeId);
    const hash = Array.from(idStr).reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return EMPLOYEE_COLORS[hash % EMPLOYEE_COLORS.length];
};
