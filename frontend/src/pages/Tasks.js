import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';

const STATUS_LABELS = { pending: 'Pending', in_progress: 'In Progress', completed: 'Completed', approved: 'Approved', rejected: 'Rejected' };
const PRIORITY_LABELS = { low: 'Low', medium: 'Medium', high: 'High', critical: 'Critical' };

function TaskCard({ task, onUpdate, role }) {
  const [showComplete, setShowComplete] = useState(false);
  const [showReview, setShowReview] = useState(false);
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);

  const pickup = async () => {
    setLoading(true);
    try {
      const res = await api.put(`/tasks/${task._id}/pickup`);
      toast.success('Task is now In Progress!');
      onUpdate(res.data);
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setLoading(false); }
  };

  const complete = async () => {
    setLoading(true);
    try {
      const res = await api.put(`/tasks/${task._id}/complete`, { completionNote: note });
      toast.success('Task marked as completed!');
      onUpdate(res.data); setShowComplete(false);
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setLoading(false); }
  };

  const review = async (action) => {
    setLoading(true);
    try {
      const res = await api.put(`/tasks/${task._id}/review`, { action, managerNote: note });
      toast.success(action === 'approve' ? 'Task approved! ✅' : 'Task sent back for revision');
      onUpdate(res.data); setShowReview(false);
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setLoading(false); }
  };

  return (
    <div className="card" style={{ marginBottom: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
            <span className={`badge badge-${task.status}`}>{STATUS_LABELS[task.status]}</span>
            <span className={`badge badge-${task.priority}`}>{PRIORITY_LABELS[task.priority]}</span>
            {task.category && <span className="badge" style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--text2)', border: '1px solid var(--border)' }}>{task.category}</span>}
          </div>
          <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>{task.title}</h3>
          {task.description && <p style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 8 }}>{task.description}</p>}
          <div style={{ fontSize: 12, color: 'var(--text2)', display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            {role === 'manager' && <span>👤 {task.assignedTo?.name}</span>}
            {role === 'employee' && <span>Assigned by {task.assignedBy?.name}</span>}
            {task.dueDate && <span>📅 Due: {new Date(task.dueDate).toLocaleDateString()}</span>}
            <span>📌 {new Date(task.createdAt).toLocaleDateString()}</span>
          </div>
          {task.completionNote && <div style={{ marginTop: 8, padding: '8px 12px', background: 'rgba(0,217,126,0.08)', borderRadius: 6, fontSize: 13, borderLeft: '3px solid var(--success)' }}>
            <strong style={{ color: 'var(--success)' }}>Completion note:</strong> {task.completionNote}
          </div>}
          {task.managerNote && <div style={{ marginTop: 8, padding: '8px 12px', background: 'rgba(233,69,96,0.08)', borderRadius: 6, fontSize: 13, borderLeft: '3px solid var(--accent)' }}>
            <strong style={{ color: 'var(--accent)' }}>Manager note:</strong> {task.managerNote}
          </div>}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 140 }}>
          {role === 'employee' && task.status === 'pending' && (
            <button className="btn btn-primary btn-sm" onClick={pickup} disabled={loading}>Pick Up</button>
          )}
          {role === 'employee' && task.status === 'in_progress' && !showComplete && (
            <button className="btn btn-success btn-sm" onClick={() => setShowComplete(true)}>Mark Complete</button>
          )}
          {role === 'manager' && task.status === 'completed' && !showReview && (
            <button className="btn btn-primary btn-sm" onClick={() => setShowReview(true)}>Review Task</button>
          )}
        </div>
      </div>

      {showComplete && (
        <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
          <textarea rows={2} placeholder="Add completion note (optional)..." value={note} onChange={e => setNote(e.target.value)} style={{ marginBottom: 10, resize: 'vertical' }} />
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-success btn-sm" onClick={complete} disabled={loading}>Submit</button>
            <button className="btn btn-secondary btn-sm" onClick={() => setShowComplete(false)}>Cancel</button>
          </div>
        </div>
      )}

      {showReview && (
        <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
          <textarea rows={2} placeholder="Add feedback note (optional)..." value={note} onChange={e => setNote(e.target.value)} style={{ marginBottom: 10, resize: 'vertical' }} />
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-success btn-sm" onClick={() => review('approve')} disabled={loading}>✅ Approve</button>
            <button className="btn btn-danger btn-sm" onClick={() => review('reject')} disabled={loading}>↩ Send Back</button>
            <button className="btn btn-secondary btn-sm" onClick={() => setShowReview(false)}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}

function CreateTaskModal({ employees, onClose, onCreate }) {
  const [form, setForm] = useState({ title: '', description: '', assignedTo: '', priority: 'medium', dueDate: '', category: '' });
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!form.assignedTo) return toast.error('Please select an employee');
    setLoading(true);
    try {
      const res = await api.post('/tasks', form);
      toast.success('Task assigned and email sent! 📧');
      onCreate(res.data);
      onClose();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setLoading(false); }
  };

  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-header">
          <span className="modal-title">Assign New Task</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text2)', fontSize: 20, cursor: 'pointer' }}>✕</button>
        </div>
        <form onSubmit={submit}>
          <div className="form-group">
            <label>Employee *</label>
            <select required value={form.assignedTo} onChange={e => setForm({ ...form, assignedTo: e.target.value })}>
              <option value="">Select employee...</option>
              {employees.map(e => <option key={e._id} value={e._id}>{e.name} ({e.department || 'No dept'})</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>Task Title *</label>
            <input required placeholder="Enter task title" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
          </div>
          <div className="form-group">
            <label>Description</label>
            <textarea rows={3} placeholder="Task details..." value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} style={{ resize: 'vertical' }} />
          </div>
          <div className="grid-2">
            <div className="form-group">
              <label>Priority</label>
              <select value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>
            <div className="form-group">
              <label>Category</label>
              <input placeholder="e.g. DevOps, Backend" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} />
            </div>
          </div>
          <div className="form-group">
            <label>Due Date</label>
            <input type="date" value={form.dueDate} onChange={e => setForm({ ...form, dueDate: e.target.value })} />
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? 'Assigning...' : '📧 Assign & Notify'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Tasks() {
  const [tasks, setTasks] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [filter, setFilter] = useState('all');
  const { user } = useAuth();

  const load = async () => {
    const [tasksRes] = await Promise.all([
      api.get('/tasks'),
      user.role === 'manager' && api.get('/users').then(res => setEmployees(res.data))
    ]);
    setTasks(tasksRes.data);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const filteredTasks = filter === 'all' ? tasks : tasks.filter(t => t.status === filter);

  const updateTask = (updated) => {
    setTasks(prev => prev.map(t => t._id === updated._id ? updated : t));
  };

  const FILTERS = user.role === 'manager'
    ? ['all', 'pending', 'in_progress', 'completed', 'approved']
    : ['all', 'pending', 'in_progress', 'completed', 'approved'];

  return (
    <div style={{ padding: 32 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700 }}>{user.role === 'manager' ? 'Team Tasks' : 'My Tasks'}</h1>
          <p style={{ color: 'var(--text2)', marginTop: 4 }}>{filteredTasks.length} tasks</p>
        </div>
        {user.role === 'manager' && (
          <button className="btn btn-primary" onClick={() => setShowCreate(true)}>+ Assign Task</button>
        )}
      </div>

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
        {FILTERS.map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{
            padding: '7px 16px', borderRadius: 20, border: 'none', fontSize: 13, fontWeight: 500, cursor: 'pointer',
            background: filter === f ? 'var(--accent)' : 'var(--surface)',
            color: filter === f ? 'white' : 'var(--text2)',
            border: filter === f ? 'none' : '1px solid var(--border)'
          }}>
            {f === 'all' ? 'All' : STATUS_LABELS[f]}
            <span style={{ marginLeft: 6, opacity: 0.7 }}>
              ({f === 'all' ? tasks.length : tasks.filter(t => t.status === f).length})
            </span>
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ color: 'var(--text2)' }}>Loading tasks...</div>
      ) : filteredTasks.length === 0 ? (
        <div className="empty-state">
          <div className="icon">📋</div>
          <h3>No tasks here</h3>
          <p>{user.role === 'manager' ? 'Assign a new task to get started.' : 'No tasks in this status.'}</p>
        </div>
      ) : (
        filteredTasks.map(task => (
          <TaskCard key={task._id} task={task} onUpdate={updateTask} role={user.role} />
        ))
      )}

      {showCreate && (
        <CreateTaskModal
          employees={employees}
          onClose={() => setShowCreate(false)}
          onCreate={task => setTasks(prev => [task, ...prev])}
        />
      )}
    </div>
  );
}
