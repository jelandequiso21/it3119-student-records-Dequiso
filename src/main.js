import './style.css'
import { supabase } from './supabaseClient.js'

const app = document.querySelector('#app')

app.innerHTML = `
  <main>
    <h1>Student Records System</h1>
    <p id="status">Checking session...</p>

    <section id="auth-section">
      <h2>Operator sign in</h2>
      <input id="email" type="email" placeholder="Email" />
      <input id="password" type="password" placeholder="Password" />
      <div>
        <button id="signin-btn">Sign in</button>
        <button id="signup-btn">Register</button>
        <button id="signout-btn">Sign out</button>
      </div>
      <p id="auth-msg"></p>
    </section>

    <section id="form-section" style="display:none">
      <h2>Add or edit a student</h2>
      <input id="student-number" placeholder="Student number (e.g. 2026-004)" />
      <input id="first-name" placeholder="First name" />
      <input id="last-name" placeholder="Last name" />
      <input id="course-code" placeholder="Course (e.g. BSIT)" />
      <div>
        <button id="save-btn">Save student</button>
        <button id="clear-btn">Clear form</button>
      </div>
      <p id="form-msg"></p>
    </section>

    <section id="list-section" style="display:none">
      <h2>Student list</h2>
      <input id="search" placeholder="Search name or student number" />
      <button id="search-btn">Search</button>
      <button id="load-all-btn">Load all</button>
      <div id="students"></div>

      <h3>Course report</h3>
      <input id="report-course" placeholder="Course" />
      <button id="count-btn">Count students</button>
      <p id="count-result"></p>
    </section>
  </main>
`

const statusEl = document.querySelector('#status')
const authMsg = document.querySelector('#auth-msg')
const formMsg = document.querySelector('#form-msg')

let editingId = null
let currentUser = null

async function checkSession() {
  const { data } = await supabase.auth.getSession()
  currentUser = data.session?.user || null
  if (currentUser) {
    statusEl.textContent = `Signed in as ${currentUser.email}`
    document.querySelector('#form-section').style.display = 'block'
    document.querySelector('#list-section').style.display = 'block'
    loadStudents()
  } else {
    statusEl.textContent = 'Not signed in. Sign in with an approved operator account.'
    document.querySelector('#form-section').style.display = 'none'
    document.querySelector('#list-section').style.display = 'none'
  }
}

async function loadStudents(searchText = '') {
  let query = supabase.from('students').select('*').order('student_id', { ascending: true })
  if (searchText) {
    query = query.or(`first_name.ilike.%${searchText}%,last_name.ilike.%${searchText}%,student_no.ilike.%${searchText}%`)
  }
  const { data, error } = await query
  const box = document.querySelector('#students')
  if (error) {
    box.innerHTML = `<p style="color:red">No access or error: ${error.message}</p>`
    return
  }
  if (!data || data.length === 0) {
    box.innerHTML = '<p>No students found.</p>'
    return
  }
  box.innerHTML = data.map(s => `
    <div style="border:1px solid #ddd;padding:10px;margin:8px 0">
      <b>${s.first_name} ${s.last_name}</b> — ${s.student_no} — ${s.course || ''}
      <div>
        <button onclick="window.__edit(${s.student_id})">Edit</button>
        <button onclick="window.__del(${s.student_id})">Delete</button>
      </div>
    </div>
  `).join('')
}

window.__edit = async (id) => {
  const { data } = await supabase.from('students').select('*').eq('student_id', id).single()
  if (!data) return
  editingId = id
  document.querySelector('#student-number').value = data.student_no || ''
  document.querySelector('#first-name').value = data.first_name || ''
  document.querySelector('#last-name').value = data.last_name || ''
  document.querySelector('#course-code').value = data.course || ''
  formMsg.textContent = 'Editing student ' + id
}

window.__del = async (id) => {
  if (!confirm('Delete this student?')) return
  const { error } = await supabase.from('students').delete().eq('student_id', id)
  if (error) alert(error.message)
  else loadStudents()
}

document.querySelector('#signin-btn').onclick = async () => {
  const email = document.querySelector('#email').value
  const password = document.querySelector('#password').value
  const { error } = await supabase.auth.signInWithPassword({ email, password })
  authMsg.textContent = error ? error.message : 'Signed in!'
  checkSession()
}

document.querySelector('#signup-btn').onclick = async () => {
  const email = document.querySelector('#email').value
  const password = document.querySelector('#password').value
  const { error } = await supabase.auth.signUp({ email, password })
  authMsg.textContent = error ? error.message : 'Check your email to confirm, then sign in.'
}

document.querySelector('#signout-btn').onclick = async () => {
  await supabase.auth.signOut()
  checkSession()
}

document.querySelector('#save-btn').onclick = async () => {
  const payload = {
    student_no: document.querySelector('#student-number').value.trim(),
    first_name: document.querySelector('#first-name').value.trim(),
    last_name: document.querySelector('#last-name').value.trim(),
    course: document.querySelector('#course-code').value.trim() || null,
  }
  if (!payload.student_no || !payload.first_name || !payload.last_name) {
    formMsg.textContent = 'Fill student number, first name, and last name.'
    return
  }
  let result
  if (editingId) {
    result = await supabase.from('students').update(payload).eq('student_id', editingId)
  } else {
    result = await supabase.from('students').insert(payload)
  }
  formMsg.textContent = result.error ? result.error.message : 'Saved!'
  if (!result.error) {
    editingId = null
    loadStudents()
  }
}

document.querySelector('#clear-btn').onclick = () => {
  editingId = null
  document.querySelectorAll('#form-section input').forEach(i => i.value = '')
  formMsg.textContent = ''
}

document.querySelector('#search-btn').onclick = () => {
  loadStudents(document.querySelector('#search').value.trim())
}
document.querySelector('#load-all-btn').onclick = () => loadStudents()

document.querySelector('#count-btn').onclick = async () => {
  const code = document.querySelector('#report-course').value.trim()
  const { data, error } = await supabase.from('students').select('*').eq('course', code)
  document.querySelector('#count-result').textContent = error ? error.message : `Students in ${code}: ${data.length}`
}

checkSession()