Vue.component('task-card', {
  props: ['card', 'col', 'isCol1Locked'],
  template: `
    <div :class="['card', { completed: card.completed }]">
      <h3>{{ card.title }}</h3>
      <ul>
        <li v-for="(item, index) in card.items" :key="index">
          <label>
            <input
              type="checkbox"
              v-model="item.done"
              @change="onChange"
              :disabled="isDisabled"
            />
            <span class="item-text">{{ item.text }}</span>
          </label>
        </li>
      </ul>

      <p v-if="card.completed && card.completedDate">
        Завершено: {{ card.completedDate }}
      </p>
    </div>
  `,
  computed: {
    isDisabled() {
      if (this.card.completed) return true;
      if (this.col === 'col1' && this.isCol1Locked) return true;
      return false;
    }
  },
  methods: {
    onChange() {
      this.$emit('update', this.card, this.col);
    }
  }
});

new Vue({
  el: '#app',
  data: {
    col1: [],
    col2: [],
    col3: [],
    newTitle: '',
    newItems: ['', '', ''] 
  },
  created() {
    
    const saved = localStorage.getItem('boardData');
    if (saved) {
      try {
        const data = JSON.parse(saved);
        this.col1 = data.col1 || [];
        this.col2 = data.col2 || [];
        this.col3 = data.col3 || [];
      } catch (e) {
        console.warn('Не удалось прочитать boardData:', e);
      }
    }
  },
  computed: {
    isCol1Locked() {
      if (this.col2.length < 5) return false;
      return this.col1.some(card => {
        const done = card.items.filter(i => i.done).length;
        return card.items.length > 0 && (done / card.items.length) > 0.5;
      });
    }
  },
  methods: {
    saveData() {
      localStorage.setItem('boardData', JSON.stringify({
        col1: this.col1,
        col2: this.col2,
        col3: this.col3
      }));
    },
    addItem() {
      if (this.newItems.length < 5) this.newItems.push('');
    },
    addCard() {
      const title = (this.newTitle || '').trim();
      const items = this.newItems.map(s => (s || '').trim()).filter(Boolean);

      if (!title || items.length < 3) {
        alert('Введите заголовок и минимум 3 пункта');
        return;
      }
      if (this.col1.length >= 3) {
        alert('Первый столбец заполнен (максимум 3 карточки)');
        return;
      }

      const card = {
        id: Date.now(),
        title,
        items: items.map(t => ({ text: t, done: false })),
        completed: false,
        completedDate: null
      };

      this.col1.push(card);
      this.newTitle = '';
      this.newItems = ['', '', ''];
      this.saveData();
    },
    updateCard(card, col) {
      const done = card.items.filter(i => i.done).length;
      const total = card.items.length;

      if (done === total && total > 0) {
        this.moveToCompleted(card);
        this.moveEligibleCol1Cards(); 
        this.saveData();
        return;
      }

      if (col === 'col1') {
        if (done / total > 0.5) {
          if (this.col2.length < 5) {
            this.moveCardBetweenArrays(card, this.col1, this.col2);
          } else {
    
          }
        }
      }

      if (col === 'col2') {
        if (done === total && total > 0) {
          this.moveToCompleted(card);
        }
      }

      this.moveEligibleCol1Cards();

      this.saveData();
    },

    moveToCompleted(card) {
      this.removeFromArray(card, this.col1);
      this.removeFromArray(card, this.col2);

      if (!card.completed) {
        card.completed = true;
        card.completedDate = new Date().toLocaleString();
      }

      if (!this.col3.includes(card)) {
        this.col3.push(card);
      }
    },

    moveEligibleCol1Cards() {
      const free = 5 - this.col2.length;
      if (free <= 0) return;

      const eligible = this.col1.filter(c => {
        if (c.completed) return false;
        const done = c.items.filter(i => i.done).length;
        return c.items.length > 0 && (done / c.items.length) > 0.5;
      });

      for (let i = 0; i < Math.min(eligible.length, free); i++) {
        this.moveCardBetweenArrays(eligible[i], this.col1, this.col2);
      }
    },

    moveCardBetweenArrays(card, fromArr, toArr) {
      const idx = fromArr.indexOf(card);
      if (idx !== -1) {
        fromArr.splice(idx, 1);
        toArr.push(card);
      }
    },
    removeFromArray(card, arr) {
      const idx = arr.indexOf(card);
      if (idx !== -1) arr.splice(idx, 1);
    }
  }
});
