<script setup>
import { ref } from 'vue';

const apiBase = ref(localStorage.getItem('apiBase') || 'http://localhost:3000');
const apiKey = ref(localStorage.getItem('apiKey') || 'admin-api-key');
const cards = ref([]);
const orders = ref([]);
const appleIds = ref([]);
const generatedCodes = ref([]);
const count = ref(10);
const message = ref('');

function saveSettings() {
  localStorage.setItem('apiBase', apiBase.value);
  localStorage.setItem('apiKey', apiKey.value);
}

async function api(path, options = {}) {
  saveSettings();
  const response = await fetch(`${apiBase.value}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey.value, ...(options.headers || {}) }
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || `HTTP ${response.status}`);
  return data;
}

async function loadAll() {
  try {
    [cards.value, orders.value, appleIds.value] = await Promise.all([
      api('/api/cards'), api('/api/orders'), api('/api/apple-ids')
    ]);
    message.value = '数据已刷新';
  } catch (error) {
    message.value = error.message;
  }
}

async function generateCards() {
  try {
    const data = await api('/api/cards/generate', { method: 'POST', body: JSON.stringify({ count: count.value }) });
    generatedCodes.value = data.codes;
    message.value = `已生成 ${data.count} 张卡密，请立即导出或复制保存。`;
    await loadAll();
  } catch (error) {
    message.value = error.message;
  }
}

async function updateCardStatus(id, status) {
  await api(`/api/cards/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) });
  await loadAll();
}

loadAll();
</script>

<template>
  <main>
    <h1>安全卡密核销后台</h1>
    <p class="notice">本后台只处理卡密与非敏感客户编号，不接收第三方账号 Session Cookie。</p>

    <section class="settings">
      <input v-model="apiBase" placeholder="API Base" />
      <input v-model="apiKey" placeholder="Admin API Key" type="password" />
      <button @click="loadAll">刷新</button>
    </section>
    <p>{{ message }}</p>

    <section>
      <h2>批量生成卡密</h2>
      <input v-model.number="count" min="1" max="1000" type="number" />
      <button @click="generateCards">生成</button>
      <pre v-if="generatedCodes.length">{{ generatedCodes.join('\n') }}</pre>
    </section>

    <section>
      <h2>卡密列表</h2>
      <table><thead><tr><th>ID</th><th>卡密</th><th>状态</th><th>过期时间</th><th>操作</th></tr></thead>
        <tbody><tr v-for="card in cards" :key="card.id">
          <td>{{ card.id }}</td><td>{{ card.code }}</td><td>{{ card.status }}</td><td>{{ card.expires_at || '-' }}</td>
          <td><button @click="updateCardStatus(card.id, 'unused')">未使用</button><button @click="updateCardStatus(card.id, 'used')">已使用</button><button @click="updateCardStatus(card.id, 'expired')">已过期</button></td>
        </tr></tbody></table>
    </section>

    <section>
      <h2>订单列表</h2>
      <table><thead><tr><th>ID</th><th>卡ID</th><th>客户编号</th><th>状态</th><th>有效期</th><th>质保期</th><th>备注</th></tr></thead>
        <tbody><tr v-for="order in orders" :key="order.id">
          <td>{{ order.id }}</td><td>{{ order.card_id }}</td><td>{{ order.customer_ref_masked }}</td><td>{{ order.recharge_status }}</td><td>{{ order.valid_until }}</td><td>{{ order.warranty_until }}</td><td>{{ order.notes }}</td>
        </tr></tbody></table>
    </section>

    <section>
      <h2>Apple ID 状态台账</h2>
      <table><thead><tr><th>ID</th><th>标签</th><th>地区</th><th>状态</th><th>余额</th><th>备注</th></tr></thead>
        <tbody><tr v-for="account in appleIds" :key="account.id">
          <td>{{ account.id }}</td><td>{{ account.label }}</td><td>{{ account.region }}</td><td>{{ account.status }}</td><td>{{ account.balance_cents / 100 }} {{ account.currency }}</td><td>{{ account.notes }}</td>
        </tr></tbody></table>
    </section>
  </main>
</template>
