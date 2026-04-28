var dadosPorPacote = {};

const pacotes = [
    { id: 'cat-med-cons', titulo: 'Medic Cons Pac', nomeArquivo: 'MEDIC_CONS_PAC' },
    { id: 'cat-conv', titulo: 'Conveniência', nomeArquivo: 'CONVENIENCIA' },
    { id: 'cat-med-rx', titulo: 'Medic Rx Generico', nomeArquivo: 'MEDIC_RX_GENERICO' },
    { id: 'cat-higiene', titulo: 'Higiene Pessoal', nomeArquivo: 'HIGIENE_PESSOAL' },
    { id: 'cat-perfume', titulo: 'Perfumaria', nomeArquivo: 'PERFUMARIA' },
    { id: 'cat-adulto', titulo: 'Cuidado Adulto', nomeArquivo: 'CUIDADO_ADULTO' },
    { id: 'cat-infantil', titulo: 'Universo Infantil', nomeArquivo: 'UNIVERSO_INFANTIL' },
    { id: 'cat-dermo', titulo: 'Dermocosmeticos', nomeArquivo: 'DERMOCOSMETICOS' },
    { id: 'cat-petcare', titulo: 'Pet Care', nomeArquivo: 'PET_CARE' },
    { id: 'cat-nutricao', titulo: 'Nutrição Saudável', nomeArquivo: 'NUTRICAO_SAUDAVEL' },
    { id: 'cat-mip', titulo: 'MIP Marca', nomeArquivo: 'MIP_MARCA' },
    { id: 'cat-alimentos', titulo: 'Alimentos', nomeArquivo: 'ALIMENTOS' },
    { id: 'cat-prec-1', titulo: 'Precificador 1', nomeArquivo: 'PRECIFICADOR_1' },
    { id: 'cat-prec-2', titulo: 'Precificador 2', nomeArquivo: 'PRECIFICADOR_2' }
];

function gerarCodigos() {
    var resultadoDiv = document.getElementById('resultado');
    var btnZip = document.getElementById('btnBaixarZip');
    var btnPdf = document.getElementById('btnBaixarPdf');
    var inputNomePdf = document.getElementById('nomeArquivoPdf');
    
    resultadoDiv.innerHTML = ''; 
    dadosPorPacote = {};
    btnZip.style.display = 'none';
    btnPdf.style.display = 'none';
    inputNomePdf.style.display = 'none';
    var temImagem = false;

    pacotes.forEach(function(pacote) {
        var textarea = document.getElementById(pacote.id).value;
        var eans = textarea.split('\n').map(function(ean) { return ean.trim(); }).filter(function(ean) { return ean.length > 0; });

        if (eans.length > 0) {
            dadosPorPacote[pacote.nomeArquivo] = [];
        }

        eans.forEach(function(ean) {
            if(ean.length === 12 || ean.length === 13) {
                temImagem = true;
                var card = document.createElement('div');
                card.className = 'barcode-card';

                var badge = document.createElement('div');
                badge.className = 'badge-pacote';
                badge.innerText = pacote.titulo;
                card.appendChild(badge);
                card.appendChild(document.createElement('br'));

                var img = document.createElement('img');
                
                try {
                    JsBarcode("#hidden-canvas", ean, {
                        format: "EAN13", displayValue: true, fontSize: 46, fontOptions: "bold", textMargin: 8, width: 4, height: 200,            
                        background: "#ffffff", lineColor: "#000000", marginTop: 10, marginBottom: 15, marginLeft: 30, marginRight: 30, font: "monospace"
                    });
                    
                    var canvasEscondido = document.getElementById("hidden-canvas");
                    var finalCanvas = document.createElement('canvas');
                    finalCanvas.width = canvasEscondido.width + 300; 
                    finalCanvas.height = canvasEscondido.height; 
                    var finalCtx = finalCanvas.getContext('2d');
                    
                    finalCtx.fillStyle = "#ffffff"; 
                    finalCtx.fillRect(0, 0, finalCanvas.width, finalCanvas.height);
                    
                    finalCtx.fillStyle = "#000000"; 
                    finalCtx.fillRect(0, 0, 150, finalCanvas.height); 
                    finalCtx.fillRect(finalCanvas.width - 150, 0, 150, finalCanvas.height); 
                    
                    var codigoX = (finalCanvas.width - canvasEscondido.width) / 2;
                    finalCtx.drawImage(canvasEscondido, codigoX, 0); 
                    
                    var finalDataUrl = finalCanvas.toDataURL("image/png");
                    img.src = finalDataUrl;
                    card.appendChild(img);
                    resultadoDiv.appendChild(card);
                    
                    dadosPorPacote[pacote.nomeArquivo].push({
                        nome: ean + '.png',
                        dadosBase64: finalDataUrl.split(',')[1] 
                    });
                    
                } catch (e) {
                    card.innerHTML = "<p class='erro-msg'>❌ Erro no EAN: " + ean + "</p>";
                    resultadoDiv.appendChild(card);
                }
            }
        });
    });

    if (temImagem) {
        btnZip.style.display = 'block';
        btnPdf.style.display = 'block';
        inputNomePdf.style.display = 'block';
        window.scrollTo({ top: document.querySelector('.botoes-acao').offsetTop, behavior: 'smooth' });
    }
}

async function baixarTodosZips() {
    var btnZip = document.getElementById('btnBaixarZip');
    var textoOriginal = btnZip.innerText;
    btnZip.innerText = "⏳ A DESCARREGAR...";
    btnZip.disabled = true;

    for (const [nomePacote, imagens] of Object.entries(dadosPorPacote)) {
        if (imagens.length > 0) {
            var zip = new JSZip();
            imagens.forEach(function(img) {
                zip.file(img.nome, img.dadosBase64, {base64: true});
            });

            const conteudoZip = await zip.generateAsync({type:"blob"});
            var link = document.createElement("a");
            link.href = URL.createObjectURL(conteudoZip);
            link.download = nomePacote + ".zip";
            link.click();

            await new Promise(resolve => setTimeout(resolve, 600));
        }
    }

    btnZip.innerText = textoOriginal;
    btnZip.disabled = false;
}

async function baixarTodosPdfs() {
    var btnPdf = document.getElementById('btnBaixarPdf');
    var textoOriginal = btnPdf.innerText;
    btnPdf.innerText = "⏳ A GERAR PDF ÚNICO...";
    btnPdf.disabled = true;

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    let currentSlot = 0; 
    let temAlgumDado = false;

    for (const pacote of pacotes) {
        const imagens = dadosPorPacote[pacote.nomeArquivo];
        
        if (imagens && imagens.length > 0) {
            temAlgumDado = true;

            for (let i = 0; i < imagens.length; i++) {
                
                if (currentSlot === 2) {
                    doc.addPage();
                    currentSlot = 0;
                }

                const imgWidth = 140; 
                const imgHeight = 60; 
                const x = (pageWidth - imgWidth) / 2;
                let yImage = 0;

                if (currentSlot === 0) {
                    yImage = (pageHeight / 4) - (imgHeight / 2);
                } else {
                    yImage = (pageHeight * 0.75) - (imgHeight / 2);
                }

                if (i === 0) {
                    doc.setFontSize(14);
                    doc.text(pacote.titulo.toUpperCase(), pageWidth / 2, yImage - 10, { align: 'center' });
                }

                const imgData = "data:image/png;base64," + imagens[i].dadosBase64;
                doc.addImage(imgData, 'PNG', x, yImage, imgWidth, imgHeight);
                
                currentSlot++; 
            }
        }
    }

    if (temAlgumDado) {
        let nomeInput = document.getElementById('nomeArquivoPdf').value.trim();
        let nomeArquivoFinal = nomeInput !== "" ? nomeInput + ".pdf" : "EANs_Completo_KINDLE.pdf";
        doc.save(nomeArquivoFinal);
    }

    btnPdf.innerText = textoOriginal;
    btnPdf.disabled = false;
}
