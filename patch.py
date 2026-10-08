import os

file_path = "d:/Prod Ver SVIMAA/svimaa/frontend/app/admin/members.tsx"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# 1. Optimize filters
target_filtered = """  const filtered = members.filter((m) => {
    const q = search.toLowerCase();
    const matchSearch = m.full_name?.toLowerCase().includes(q) || m.email?.toLowerCase().includes(q);
    const matchFilter =
      filter === "All"      ? true :
      filter === "Pending"  ? m.approved === 0 :
      filter === "Approved" ? m.approved === 1 : m.approved === 2;
    return matchSearch && matchFilter;
  });"""
replacement_filtered = """  const filtered = React.useMemo(() => {
    return members.filter((m) => {
      const q = search.toLowerCase();
      const matchSearch = m.full_name?.toLowerCase().includes(q) || m.email?.toLowerCase().includes(q);
      const matchFilter =
        filter === "All"      ? true :
        filter === "Pending"  ? m.approved === 0 :
        filter === "Approved" ? m.approved === 1 : m.approved === 2;
      return matchSearch && matchFilter;
    });
  }, [members, search, filter]);"""
content = content.replace(target_filtered, replacement_filtered)


# 2. Optimize counts
target_counts = """  const counts = {
    All:      members.length,
    Approved: members.filter(m => m.approved === 1).length,
    Pending:  members.filter(m => m.approved === 0).length,
    Rejected: members.filter(m => m.approved === 2).length,
  };"""
replacement_counts = """  const counts = React.useMemo(() => ({
    All:      members.length,
    Approved: members.filter(m => m.approved === 1).length,
    Pending:  members.filter(m => m.approved === 0).length,
    Rejected: members.filter(m => m.approved === 2).length,
  }), [members]);"""
content = content.replace(target_counts, replacement_counts)


# 3. Hide delete button
target_delete = """                      <Pressable onPress={() => handleDelete(m.id)}>
                        <Feather name="trash-2" size={16} color={C.red} />
                      </Pressable>"""
replacement_delete = """                      {role === 'super_admin' && (
                        <Pressable onPress={() => handleDelete(m.id)}>
                          <Feather name="trash-2" size={16} color={C.red} />
                        </Pressable>
                      )}"""
content = content.replace(target_delete, replacement_delete)

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)
print("Updated successfully")
