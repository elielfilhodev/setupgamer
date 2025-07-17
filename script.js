document.addEventListener('DOMContentLoaded', () => {
    // --- STATE ---
    // Carrega os itens do armazenamento local ou inicializa um array vazio.
    let items = JSON.parse(localStorage.getItem('gamerBudgetItems')) || [];

    // --- DOM ELEMENTS ---
    // Agrupa todos os elementos do DOM que serão manipulados para fácil acesso.
    const DOMElements = {
        itemForm: document.getElementById('item-form'),
        itemsList: document.getElementById('items-list'),
        totalValue: document.getElementById('total-value'),
        searchInput: document.getElementById('search-items'),
        filterCategory: document.getElementById('filter-category'),
        clearAllBtn: document.getElementById('clear-all'),
        generatePdfBtn: document.getElementById('generate-pdf'),
        shareBudgetBtn: document.getElementById('share-budget'),
        editModal: document.getElementById('edit-modal'),
        editForm: document.getElementById('edit-form'),
        closeModalBtn: document.querySelector('.close-modal'),
        currentYear: document.getElementById('current-year'),
    };

    // --- FUNCTIONS ---

    /**
     * Salva a lista de itens atual no localStorage.
     */
    const saveItems = () => {
        localStorage.setItem('gamerBudgetItems', JSON.stringify(items));
    };

    /**
     * Formata um número para o padrão de moeda brasileiro (BRL).
     * @param {number} value - O valor a ser formatado.
     * @returns {string} - O valor formatado como moeda.
     */
    const formatCurrency = (value) => {
        return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    };

    /**
     * Calcula e atualiza o valor total do orçamento na tela.
     */
    const updateTotal = () => {
        const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        DOMElements.totalValue.textContent = total.toFixed(2).replace('.', ',');
    };

    /**
     * Renderiza a lista de itens na tabela HTML.
     * @param {Array} [itemsToRender=items] - A lista de itens a ser exibida.
     */
    const renderItems = (itemsToRender = items) => {
        DOMElements.itemsList.innerHTML = '';

        if (itemsToRender.length === 0) {
            DOMElements.itemsList.innerHTML = '<tr><td colspan="6" style="text-align: center;">Nenhum item encontrado</td></tr>';
            return;
        }

        itemsToRender.forEach((item) => {
            const originalIndex = items.indexOf(item);
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${item.name}</td>
                <td>${item.category}</td>
                <td>${item.quantity}</td>
                <td>${formatCurrency(item.price)}</td>
                <td>${item.store || '-'}</td>
                <td>
                    <button class="action-btn edit" data-index="${originalIndex}" aria-label="Editar item"><i class="fas fa-edit"></i></button>
                    <button class="action-btn delete" data-index="${originalIndex}" aria-label="Excluir item"><i class="fas fa-trash"></i></button>
                </td>
            `;
            DOMElements.itemsList.appendChild(row);
        });
    };

    /**
     * Adiciona um novo item à lista a partir do formulário.
     * @param {Event} e - O evento de submit do formulário.
     */
    const addItem = (e) => {
        e.preventDefault();
        const form = DOMElements.itemForm;
        
        items.push({
            name: form.querySelector('#item-name').value,
            category: form.querySelector('#item-category').value,
            quantity: parseInt(form.querySelector('#item-quantity').value),
            price: parseFloat(form.querySelector('#item-price').value),
            store: form.querySelector('#item-store').value,
            link: form.querySelector('#item-link').value,
            parcels: form.querySelector('#item-parcels').value
        });
        
        saveItems();
        applyFilters();
        updateTotal();
        form.reset();
        form.querySelector('#item-name').focus();
    };

    /**
     * Manipula cliques na lista de itens para editar ou excluir.
     * @param {Event} e - O evento de clique.
     */
    const handleListClick = (e) => {
        const target = e.target.closest('button');
        if (!target) return;

        const index = parseInt(target.dataset.index);

        if (target.classList.contains('edit')) {
            openEditModal(index);
        } else if (target.classList.contains('delete')) {
            deleteItem(index);
        }
    };
    
    /**
     * Exclui um item da lista.
     * @param {number} index - O índice do item a ser excluído.
     */
    const deleteItem = (index) => {
        if (confirm('Tem certeza que deseja remover este item?')) {
            items.splice(index, 1);
            saveItems();
            applyFilters();
            updateTotal();
        }
    };

    /**
     * Abre o modal de edição com os dados do item selecionado.
     * @param {number} index - O índice do item a ser editado.
     */
    const openEditModal = (index) => {
        const item = items[index];
        const form = DOMElements.editForm;
        form.querySelector('#edit-index').value = index;
        form.querySelector('#edit-name').value = item.name;
        form.querySelector('#edit-category').value = item.category;
        form.querySelector('#edit-quantity').value = item.quantity;
        form.querySelector('#edit-price').value = item.price;
        form.querySelector('#edit-store').value = item.store;
        form.querySelector('#edit-link').value = item.link;
        form.querySelector('#edit-parcels').value = item.parcels;
        DOMElements.editModal.style.display = 'block';
    };
    
    /**
     * Salva as alterações feitas em um item no modal de edição.
     * @param {Event} e - O evento de submit do formulário de edição.
     */
    const saveEditedItem = (e) => {
        e.preventDefault();
        const form = DOMElements.editForm;
        const index = parseInt(form.querySelector('#edit-index').value);
        items[index] = {
            name: form.querySelector('#edit-name').value,
            category: form.querySelector('#edit-category').value,
            quantity: parseInt(form.querySelector('#edit-quantity').value),
            price: parseFloat(form.querySelector('#edit-price').value),
            store: form.querySelector('#edit-store').value,
            link: form.querySelector('#edit-link').value,
            parcels: form.querySelector('#edit-parcels').value
        };
        
        saveItems();
        applyFilters();
        updateTotal();
        closeModal();
    };
    
    /**
     * Fecha o modal de edição.
     */
    const closeModal = () => {
        DOMElements.editModal.style.display = 'none';
    };

    /**
     * Aplica os filtros de categoria e busca de texto e re-renderiza a lista.
     */
    const applyFilters = () => {
        const searchTerm = DOMElements.searchInput.value.toLowerCase();
        const selectedCategory = DOMElements.filterCategory.value;

        let filteredItems = items;

        if (selectedCategory !== 'all') {
            filteredItems = filteredItems.filter(item => item.category === selectedCategory);
        }

        if (searchTerm) {
            filteredItems = filteredItems.filter(item =>
                item.name.toLowerCase().includes(searchTerm) ||
                (item.store && item.store.toLowerCase().includes(searchTerm))
            );
        }

        renderItems(filteredItems);
    };
    
    /**
     * Limpa todos os itens da lista.
     */
    const clearAllItems = () => {
        if (items.length === 0) return;
        if (confirm('Tem certeza que deseja remover TODOS os itens?')) {
            items = [];
            saveItems();
            applyFilters();
            updateTotal();
        }
    };
    
    /**
     * Copia um texto para a área de transferência do usuário.
     * @param {string} text - O texto a ser copiado.
     */
    const copyToClipboard = async (text) => {
        try {
            await navigator.clipboard.writeText(text);
            alert('Orçamento copiado para a área de transferência!');
        } catch (err) {
            console.error('Falha ao copiar: ', err);
            alert('Não foi possível copiar o orçamento.');
        }
    };
    
    /**
     * Gera um texto para compartilhamento e usa a API Web Share ou copia para o clipboard.
     */
    const shareBudget = () => {
        if (items.length === 0) {
            alert('Adicione itens antes de compartilhar.');
            return;
        }

        const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        let shareText = `Meu orçamento de Setup Gamer (Total: ${formatCurrency(total)}):\n\n`;
        items.forEach(item => {
            shareText += `- ${item.quantity}x ${item.name} (${item.category}): ${formatCurrency(item.price)}\n`;
            if (item.link) shareText += `  Link: ${item.link}\n`;
        });
        
        if (navigator.share) {
            navigator.share({
                title: 'Meu Orçamento de Setup Gamer',
                text: shareText,
                url: window.location.href
            }).catch(err => console.log('Erro ao compartilhar:', err));
        } else {
            copyToClipboard(shareText);
        }
    };

    /**
     * Gera e baixa um arquivo PDF com o resumo do orçamento.
     */
    const generatePDF = () => {
        if (items.length === 0) {
            alert('Adicione itens antes de gerar o PDF.');
            return;
        }
        
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        const today = new Date();
        const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

        // Cabeçalho do PDF
        doc.setFontSize(20);
        doc.setTextColor(108, 92, 231);
        doc.text('Orçamento Setup Gamer', 105, 20, { align: 'center' });
        
        doc.setFontSize(12);
        doc.setTextColor(100);
        doc.text(`Gerado em: ${today.toLocaleDateString('pt-BR')}`, 105, 30, { align: 'center' });
        
        // Geração da Tabela com o Hook para links
        doc.autoTable({
            startY: 40,
            head: [['Item', 'Categoria', 'Qtd', 'Preço Unit.', 'Subtotal', 'Loja']],
            body: items.map(item => [
                item.name,
                item.category,
                item.quantity,
                formatCurrency(item.price),
                formatCurrency(item.price * item.quantity),
                item.store || '-'
            ]),
            styles: { fontSize: 10, cellPadding: 3, halign: 'center', valign: 'middle' },
            headStyles: { fillColor: [108, 92, 231], textColor: 255, fontStyle: 'bold' },
            alternateRowStyles: { fillColor: [240, 240, 255] },
            columnStyles: { 
                0: { halign: 'left' }, // Coluna "Item"
                1: { halign: 'left' }  // Coluna "Categoria"
            },
            
            // =======================================================
            // NOVA SEÇÃO PARA ADICIONAR OS LINKS CLICÁVEIS
            // =======================================================
            didDrawCell: (data) => {
                // Verifica se a célula está na primeira coluna (índice 0, "Item") e não é do cabeçalho
                if (data.column.index === 0 && data.cell.section === 'body') {
                    const item = items[data.row.index];
                    
                    // Verifica se o item correspondente possui um link
                    if (item && item.link) {
                        // Define a cor do texto para azul para indicar um link
                        doc.setTextColor(0, 0, 255);
                        // Adiciona o texto novamente como um link clicável sobre o texto já desenhado
                        // As coordenadas (data.cell.x, data.cell.y) garantem a posição correta
                        doc.textWithLink(
                            item.name, 
                            data.cell.x + 3, // Adiciona um pequeno preenchimento horizontal
                            data.cell.y + data.cell.height / 2, // Centraliza verticalmente
                            { 
                                url: item.link, 
                                baseline: 'middle' 
                            }
                        );
                        // Restaura a cor do texto para preto para as próximas células
                        doc.setTextColor(0, 0, 0);
                    }
                }
            }
        });

        // Exibição do Total
        const finalY = doc.lastAutoTable.finalY || 50;
        doc.setFontSize(14);
        doc.setTextColor(0);
        doc.text(`Total: ${formatCurrency(total)}`, 14, finalY + 15);
        
        // Salva o PDF
        doc.save(`Orçamento_Setup_Gamer_${today.toISOString().split('T')[0]}.pdf`);
    };

    // --- EVENT LISTENERS ---
    // Adiciona todos os listeners de eventos aos elementos do DOM.
    DOMElements.itemForm.addEventListener('submit', addItem);
    DOMElements.searchInput.addEventListener('input', applyFilters);
    DOMElements.filterCategory.addEventListener('change', applyFilters);
    DOMElements.clearAllBtn.addEventListener('click', clearAllItems);
    DOMElements.generatePdfBtn.addEventListener('click', generatePDF);
    DOMElements.shareBudgetBtn.addEventListener('click', shareBudget);
    DOMElements.editForm.addEventListener('submit', saveEditedItem);
    DOMElements.closeModalBtn.addEventListener('click', closeModal);
    DOMElements.itemsList.addEventListener('click', handleListClick);
    window.addEventListener('click', (e) => {
        if (e.target === DOMElements.editModal) closeModal();
    });

    // --- INITIALIZATION ---
    /**
     * Função de inicialização que é executada quando a página carrega.
     */
    const init = () => {
        DOMElements.currentYear.textContent = new Date().getFullYear();
        applyFilters();
        updateTotal();
    };

    init();
});