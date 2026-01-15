/* ==========================================================================
   CONFIG & HELPERS
   ========================================================================== */
const v = (id) => {
    const el = document.getElementById(id);
    return el ? el.value : "";
};

const formatD = (d) => d ? d.split("-").reverse().join("/") : ".................";
const font = "helvetica"; 

// Variable pour stocker le logo en Base64
let logoBase64 = null;

window.onload = () => {
    document.getElementById('faita').value = "Perpignan";
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('dateSignature').value = today;
    if(document.getElementById('date_fermeture')) document.getElementById('date_fermeture').value = today;

    // Tentative de chargement du logo dès le début
    setTimeout(chargerLogoBase64, 500);
};

/* --- Gestion Image Logo (Robustesse) --- */
function chargerLogoBase64() {
    const imgElement = document.getElementById('logo-source');
    
    // Si l'image n'est pas chargée, on attend un peu
    if (!imgElement.complete || imgElement.naturalWidth === 0) {
        console.warn("Logo pas encore prêt ou introuvable.");
        return;
    }

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    canvas.width = imgElement.naturalWidth;
    canvas.height = imgElement.naturalHeight;
    ctx.drawImage(imgElement, 0, 0);

    try {
        logoBase64 = canvas.toDataURL("image/png");
        console.log("Logo converti pour PDF avec succès.");
    } catch (e) {
        console.error("Erreur de sécurité (CORS/Local) sur le logo :", e);
        // Si erreur (fichier local), on essaie de l'utiliser sans base64 si possible ou on abandonne le filigrane
        logoBase64 = null; 
    }
}

// Fonction pour dessiner le logo en filigrane (Background)
function ajouterFiligrane(pdf) {
    if (logoBase64) {
        try {
            pdf.saveGraphicsState();
            // Transparence très légère (0.10)
            pdf.setGState(new pdf.GState({ opacity: 0.10 }));
            
            const width = 120;
            const height = 120; 
            const x = (210 - width) / 2;
            const y = (297 - height) / 2;
            
            pdf.addImage(logoBase64, 'PNG', x, y, width, height);
            pdf.restoreGraphicsState();
        } catch(e) {
            console.warn("Impossible d'ajouter le filigrane (probablement restriction locale).");
        }
    }
}

/* --- Navigation & Logique Interface --- */
function switchView(viewName) {
    const sections = ['section-main', 'section-transport', 'section-fermeture'];
    sections.forEach(s => document.getElementById(s).classList.add('hidden'));

    const villeBase = v("faita");
    const dateBase = v("dateSignature");

    if (viewName === 'main') {
        document.getElementById('section-main').classList.remove('hidden');
    } 
    else if (viewName === 'transport') {
        document.getElementById('section-transport').classList.remove('hidden');
        if(!v("faita_transport")) document.getElementById('faita_transport').value = villeBase;
        if(!v("dateSignature_transport")) document.getElementById('dateSignature_transport').value = dateBase;
        if(!v("lieu_depart_t")) document.getElementById('lieu_depart_t').value = v("lieu_deces");
    } 
    else if (viewName === 'fermeture') {
        document.getElementById('section-fermeture').classList.remove('hidden');
        if(!v("faita_fermeture")) document.getElementById('faita_fermeture').value = villeBase;
        if(!v("dateSignature_fermeture")) document.getElementById('dateSignature_fermeture').value = dateBase;
        togglePresence('famille');
    }
}

function toggleProf(isAutre) { 
    document.getElementById('profession_autre').disabled = !isAutre; 
    if(!isAutre) document.getElementById('profession_autre').value = "";
}

function toggleConjoint() {
    const sit = document.getElementById("matrimoniale").value;
    const isActive = ["Marié(e)", "Veuf(ve)", "Divorcé(e)"].includes(sit);
    document.getElementById("conjoint").disabled = !isActive;
    if(!isActive) document.getElementById("conjoint").value = "";
}

function togglePresence(type) {
    const fam = document.getElementById('bloc_presence_famille');
    const pol = document.getElementById('bloc_presence_police');
    const radios = document.getElementsByName('type_presence');
    radios.forEach(r => { if(r.value === type) r.checked = true; });

    if (type === 'famille') {
        fam.classList.remove('hidden');
        pol.classList.add('hidden');
    } else {
        fam.classList.add('hidden');
        pol.classList.remove('hidden');
    }
}

function copierMandant() {
    const nom = v("soussigne");
    const lien = v("lien");
    const adr = v("demeurant");
    if(nom) document.getElementById('f_nom_prenom').value = nom;
    if(lien) document.getElementById('f_lien').value = lien;
    if(adr) document.getElementById('f_adresse').value = adr;
    
    const btn = document.querySelector('.btn-link');
    const originalText = btn.innerHTML;
    btn.innerHTML = '<i class="fas fa-check"></i> Copié !';
    btn.style.color = "#27ae60";
    setTimeout(() => {
        btn.innerHTML = originalText;
        btn.style.color = "";
    }, 1500);
}

function getProf() {
    const radios = document.getElementsByName('prof_type');
    for (const r of radios) {
        if (r.checked) return r.value === "autre" ? v("profession_autre") : r.value;
    }
    return "";
}

function getSituationComplete() {
    const sit = v("matrimoniale");
    const conj = v("conjoint");
    if (conj && !document.getElementById("conjoint").disabled) {
        if (sit === "Marié(e)") return `${sit} à ${conj}`;
        else return `${sit} de ${conj}`;
    }
    return sit;
}

/* ==========================================================================
   OUTILS GENERATION PDF
   ========================================================================== */
function dessinerCadre(pdf) {
    // 1. Filigrane
    ajouterFiligrane(pdf);

    // 2. Cadre
    pdf.setDrawColor(26, 90, 143); pdf.setLineWidth(0.8); pdf.rect(5, 5, 200, 287);
    pdf.setLineWidth(0.2); pdf.rect(6.5, 6.5, 197, 284);
    
    pdf.setFont(font, "bold"); pdf.setTextColor(34, 155, 76); pdf.setFontSize(12);
    pdf.text("POMPES FUNEBRES SOLIDAIRE PERPIGNAN", 105, 15, { align: "center" });
    
    pdf.setTextColor(80); pdf.setFontSize(8); pdf.setFont(font, "normal");
    pdf.text("32 boulevard Léon Jean Grégory Thuir - TEL : 07.55.18.27.77", 105, 20, { align: "center" });
    pdf.text("HABILITATION N° : 23-66-0205 | SIRET : 53927029800042", 105, 24, { align: "center" });
}

function helperLignePropre(pdf, label, value, x, y, dotsStart = 60) {
    pdf.setFont(font, "bold"); pdf.setTextColor(0);
    pdf.text(label, x, y);
    const labelWidth = pdf.getTextWidth(label);
    let currentX = x + labelWidth + 2;
    pdf.setFont(font, "normal"); pdf.setTextColor(150);
    const limit = dotsStart > currentX ? dotsStart : currentX + 5;
    while(currentX < limit) { pdf.text(".", currentX, y); currentX += 1.5; }
    pdf.text(" : ", limit, y);
    if(value) {
        pdf.setFont(font, "bold"); pdf.setTextColor(0);
        pdf.text(String(value), limit + 5, y);
    }
}

/* --- 1. POUVOIR --- */
function genererPouvoir() {
    // On force le rechargement du logo si pas fait (cas navigation rapide)
    if(!logoBase64) chargerLogoBase64();

    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF();
    
    dessinerCadre(pdf);
    
    pdf.setFillColor(245, 245, 245); pdf.rect(20, 35, 170, 12, 'F');
    pdf.setFontSize(18); pdf.setTextColor(180, 0, 0); pdf.setFont(font, "bold");
    pdf.text("POUVOIR", 105, 43, { align: "center" });
    
    pdf.setFontSize(10); pdf.setTextColor(0);
    let y = 60;
    helperLignePropre(pdf, "Je soussigné(e)", v("soussigne"), 20, y, 70); y+=8;
    helperLignePropre(pdf, "Demeurant à", v("demeurant"), 20, y, 70); y+=8;
    helperLignePropre(pdf, "Lien de parenté", v("lien"), 20, y, 70); y+=12;
    
    pdf.text("Ayant qualité pour pourvoir aux funérailles de :", 20, y); y+=8;

    const detailPrestation = `${v("prestation").toUpperCase()} prévue le ${formatD(v("date_prestation"))} à ${v("lieu_prestation")}`;
    pdf.setFillColor(255, 243, 205); pdf.rect(20, y-5, 170, 10, 'F');
    pdf.setDrawColor(200); pdf.rect(20, y-5, 170, 10);
    pdf.setFont(font, "bold"); pdf.setTextColor(180,0,0);
    pdf.text("PRESTATION : " + detailPrestation, 105, y+1, { align: "center" });
    
    y += 12;
    const data = [
        ["Nom d'usage", v("nom")], ["Nom de jeune fille", v("nom_jeune_fille")],
        ["Prénoms", v("prenom")], ["Né(e) le", formatD(v("date_naiss")) + " à " + v("lieu_naiss")],
        ["Décédé(e) le", formatD(v("date_deces")) + " à " + v("lieu_deces")],
        ["Domicile", v("adresse_fr")], ["Situation", getSituationComplete()],
        ["Filiation", `De ${v("pere")} et de ${v("mere")}`]
    ];

    pdf.setTextColor(0); pdf.setFontSize(9);
    data.forEach(row => {
        // Fond blanc pour lisibilité sur filigrane
        pdf.setFillColor(252, 253, 255);
        pdf.rect(20, y-4, 50, 7, 'F'); pdf.rect(70, y-4, 120, 7, 'F');
        
        pdf.setDrawColor(0);
        pdf.rect(20, y-4, 50, 7); pdf.rect(70, y-4, 120, 7);
        pdf.setFont(font, "normal"); pdf.text(row[0], 22, y+1);
        pdf.setFont(font, "bold"); pdf.text(String(row[1] || ""), 72, y+1);
        y += 7;
    });

    y += 15;
    pdf.setFont(font, "bold"); pdf.setFontSize(10);
    pdf.text("Donne mandat aux Pompes Funèbres Solidaire Perpignan pour :", 20, y);
    pdf.setFont(font, "normal");
    pdf.text("- Me représenter auprès des mairies, cultes, cimetières et crématoriums.", 25, y+6);
    pdf.text("- Effectuer toutes les démarches administratives nécessaires.", 25, y+11);
    pdf.text("- Payer les sommes dues pour les frais d'obsèques.", 25, y+16);
    
    y = 240;
    pdf.line(20, y, 190, y); y += 10;
    pdf.text(`Fait à ${v("faita")}, le ${formatD(v("dateSignature"))}`, 25, y);
    pdf.setFont(font, "bold");
    pdf.text("Signature du Mandant", 150, y, { align: "center" });

    pdf.save(`Pouvoir_${v("nom")}.pdf`);
}

/* --- 2. DECLARATION (Officielle - Sans logo PF en haut) --- */
function genererDeclaration() {
    if(!logoBase64) chargerLogoBase64();
    
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF();
    
    // Filigrane (facultatif ici car document officiel, mais on le met si demandé)
    ajouterFiligrane(pdf);
    
    pdf.setFont("times", "bold");
    
    // TITRE
    pdf.setFontSize(18);
    pdf.text("DECLARATION DE DECES", 105, 30, { align: "center" });
    pdf.setLineWidth(0.5);
    pdf.line(65, 32, 145, 32);

    // Sous-titre
    pdf.setFontSize(11);
    pdf.text("Dans tous les cas à remettre obligatoirement complété et signé", 105, 40, { align: "center" });
    pdf.setLineWidth(0.3);
    pdf.line(45, 41, 165, 41);

    let y = 60; 
    const margin = 20;
    const endLine = 190;
    const dotStep = 2;

    const drawFormLine = (label, val, yPos) => {
        pdf.setFont("times", "bold");
        pdf.setFontSize(11);
        pdf.text(label + " : ", margin, yPos);
        const startDots = margin + pdf.getTextWidth(label + " : ");
        let curX = startDots;
        pdf.setFont("times", "normal");
        while (curX < endLine) { pdf.text(".", curX, yPos); curX += dotStep; }

        if (val) {
            pdf.setFont("times", "bold");
            const valWidth = pdf.getTextWidth(val);
            const textX = startDots + 5; 
            // Rectangle blanc pour cacher les points et le filigrane sous le texte
            pdf.setFillColor(255, 255, 255);
            pdf.rect(textX - 1, yPos - 4, valWidth + 2, 5, 'F');
            pdf.text(val.toUpperCase(), textX, yPos);
        }
    };

    drawFormLine("NOM", v("nom"), y); y += 12;
    drawFormLine("NOM DE JEUNE FILLE", v("nom_jeune_fille"), y); y += 12;
    drawFormLine("Prénoms", v("prenom"), y); y += 12;

    pdf.setFont("times", "bold");
    pdf.text("Né(e) le : ", margin, y);
    let cx = margin + pdf.getTextWidth("Né(e) le : ");
    while(cx < endLine) { pdf.text(".", cx, y); cx += dotStep; }
    if(v("date_naiss")) {
         pdf.setFillColor(255); pdf.rect(margin + 25, y-4, 30, 5, 'F');
         pdf.text(formatD(v("date_naiss")), margin + 25, y);
    }
    y += 12;

    pdf.setFont("times", "bold");
    pdf.text("A", margin, y);
    cx = margin + pdf.getTextWidth("A");
    while(cx < endLine) { pdf.text(".", cx, y); cx += dotStep; }
    if(v("lieu_naiss")) {
        pdf.setFillColor(255); pdf.rect(margin + 10, y-4, 80, 5, 'F');
        pdf.text(v("lieu_naiss").toUpperCase(), margin + 10, y);
    }
    y += 15;

    pdf.setFont("times", "bold");
    const labelDeces = "DATE ET LIEU DU DECES LE";
    pdf.text(labelDeces, margin, y);
    pdf.setLineWidth(0.3);
    pdf.line(margin, y+1, margin + pdf.getTextWidth(labelDeces), y+1);
    
    cx = margin + pdf.getTextWidth(labelDeces) + 2;
    while(cx < 130) { pdf.text(".", cx, y); cx += dotStep; }
    if(v("date_deces")) {
        pdf.setFillColor(255); pdf.rect(90, y-4, 30, 5, 'F');
        pdf.text(formatD(v("date_deces")), 90, y);
    }

    pdf.text("A", 135, y);
    cx = 140;
    while(cx < endLine) { pdf.text(".", cx, y); cx += dotStep; }
    if(v("lieu_deces")) {
        pdf.setFillColor(255); pdf.rect(145, y-4, 40, 5, 'F');
        pdf.text(v("lieu_deces").toUpperCase(), 145, y);
    }
    
    y += 5;
    pdf.setFont("times", "bold"); pdf.setFontSize(10);
    pdf.text("(en son domicile, en clinique, à l'hôpital)", margin, y);
    pdf.line(margin, y+1, margin + pdf.getTextWidth("(en son domicile, en clinique, à l'hôpital)"), y+1);

    y += 20;
    
    pdf.setFontSize(11);
    pdf.text("PROFESSION :", margin, y);
    pdf.line(margin, y+1, margin + pdf.getTextWidth("PROFESSION :"), y+1);
    
    y += 10;
    const profType = getProf(); 
    
    // Cases à cocher (Fond blanc pour masquer filigrane)
    pdf.setFillColor(255); pdf.rect(margin + 5, y-4, 6, 6, 'F'); pdf.rect(margin + 5, y-4, 6, 6);
    pdf.text("Sans profession", margin + 15, y+1);
    if(profType === "Sans profession") {
        pdf.setFontSize(14); pdf.text("X", margin + 6.5, y+1); pdf.setFontSize(11);
    }

    pdf.setFillColor(255); pdf.rect(margin + 70, y-4, 6, 6, 'F'); pdf.rect(margin + 70, y-4, 6, 6);
    pdf.text("Retraité(e)", margin + 80, y+1);
    if(profType === "Retraité(e)") {
        pdf.setFontSize(14); pdf.text("X", margin + 71.5, y+1); pdf.setFontSize(11);
    }

    if(profType !== "Sans profession" && profType !== "Retraité(e)" && profType !== "") {
        pdf.text("Autre : " + profType.toUpperCase(), margin + 120, y+1);
    }

    y += 15;
    drawFormLine("DOMICILIE(E)", v("adresse_fr"), y); y += 15;
    drawFormLine("FILS OU FILLE de (Prénoms et nom du père)", v("pere"), y); y += 12;
    drawFormLine("Et de (prénoms et nom de la mère)", v("mere"), y); y += 15;
    drawFormLine("Situation Matrimoniale", getSituationComplete(), y); y += 15;
    drawFormLine("NATIONALITE", v("nationalite"), y); y += 30;

    pdf.setFont("times", "bold");
    pdf.text("NOM ET SIGNATURE DES POMPES FUNEBRES EN CHARGE DES OBSEQUES", 105, y, { align: "center" });
    y += 10;
    try {
        pdf.setFontSize(10);
        pdf.text("PF SOLIDAIRE - Mustapha CHERKAOUI", 105, y+5, { align: "center" });
        pdf.text("32 Bd Léon Jean Grégory, 66300 THUIR", 105, y+10, { align: "center" });
    } catch(e){}

    pdf.save(`Declaration_Deces_${v("nom")}.pdf`);
}

/* --- 3. FERMETURE --- */
function genererFermeture() {
    if(!logoBase64) chargerLogoBase64();
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF();
    
    dessinerCadre(pdf);

    const isPolice = document.querySelector('input[name="type_presence"][value="police"]').checked;
    
    pdf.setFillColor(235, 245, 251); pdf.rect(20, 38, 170, 20, 'F');
    pdf.setDrawColor(26, 90, 143); pdf.rect(20, 38, 170, 20);
    
    pdf.setFontSize(13); pdf.setTextColor(26, 90, 143); pdf.setFont(font, "bold");
    pdf.text("PROCÈS-VERBAL DE FERMETURE DE CERCUEIL", 105, 45, { align: "center" });
    
    pdf.setFontSize(9); pdf.setTextColor(0);
    const subTitle = isPolice ? "ET SCELLEMENT SUR RÉQUISITION (ABSENCE DE FAMILLE)" : "ET SCELLEMENT EN PRÉSENCE DE LA FAMILLE";
    pdf.text(subTitle, 105, 53, { align: "center" });

    let y = 75; const xL = 25; const xD = 80;

    pdf.setFont(font, "bold"); pdf.text("L'ENTREPRISE DE POMPES FUNÈBRES :", xL, y); y+=7;
    pdf.setFont(font, "normal");
    pdf.text("Nous, PF Solidaire (Hab. 23-66-0205), certifions avoir procédé à la fermeture.", xL, y); y+=10;
    
    helperLignePropre(pdf, "DATE", formatD(v("date_fermeture")), xL, y, xD);
    helperLignePropre(pdf, "LIEU", v("lieu_fermeture"), 110, y, 125); y+=15;

    // Fond blanc sur la zone défunt pour lisibilité
    pdf.setFillColor(250, 250, 250); pdf.rect(20, y-5, 170, 32, 'F');
    pdf.setFont(font, "bold"); pdf.text("CONCERNANT LE DÉFUNT(E) :", xL, y); y+=8;
    helperLignePropre(pdf, "NOM / PRÉNOMS", `${v("nom")} ${v("prenom")}`, xL, y, xD); y+=8;
    helperLignePropre(pdf, "NÉ(E) LE", formatD(v("date_naiss")) + ` à ${v("lieu_naiss")}`, xL, y, xD); y+=8;
    helperLignePropre(pdf, "DÉCÉDÉ(E) LE", formatD(v("date_deces")) + ` à ${v("lieu_deces")}`, xL, y, xD); y+=15;

    pdf.line(20, y, 190, y); y+=10;
    
    if(isPolice) {
        pdf.setFont(font, "bold"); pdf.text("EN PRÉSENCE DE L'AUTORITÉ DE POLICE :", xL, y); y+=6;
        pdf.setFont(font, "italic"); pdf.setFontSize(8);
        pdf.text("(Requis en l'absence de famille ou d'ayants droit connus sur place)", xL, y); 
        pdf.setFontSize(10); pdf.setFont(font, "normal"); y+=8;
        helperLignePropre(pdf, "NOM & GRADE", v("p_nom_grade"), xL, y, xD); y+=8;
        helperLignePropre(pdf, "AFFECTATION", v("p_commissariat"), xL, y, xD);
    } else {
        pdf.setFont(font, "bold"); pdf.text("EN PRÉSENCE DE (FAMILLE) :", xL, y); y+=10;
        helperLignePropre(pdf, "NOM & PRÉNOM", v("f_nom_prenom"), xL, y, xD); y+=8;
        helperLignePropre(pdf, "LIEN DE PARENTÉ", v("f_lien"), xL, y, xD); y+=8;
        helperLignePropre(pdf, "DOMICILE", v("f_adresse"), xL, y, xD);
    }

    y = 220;
    // Fonds blancs pour signatures
    pdf.setFillColor(255); pdf.rect(20, y, 80, 35, 'F'); pdf.rect(110, y, 80, 35, 'F');
    pdf.rect(20, y, 80, 35); pdf.rect(110, y, 80, 35);
    
    pdf.setFillColor(230); pdf.rect(20, y, 80, 7, 'F'); pdf.rect(110, y, 80, 7, 'F');
    pdf.setFontSize(9); pdf.setFont(font, "bold");
    const labelGauche = isPolice ? "L'OFFICIER DE POLICE" : "LA FAMILLE";
    pdf.text(labelGauche, 60, y+5, { align: "center" });
    pdf.text("L'OPERATEUR FUNÉRAIRE", 150, y+5, { align: "center" });
    pdf.setFont(font, "italic"); pdf.setFontSize(7);
    if(!isPolice) pdf.text("(Mention 'Lu et approuvé')", 60, y+32, { align: "center" });
    
    y += 45;
    pdf.setFont(font, "normal"); pdf.setFontSize(10);
    pdf.text(`Fait à ${v("faita_fermeture")}, le ${formatD(v("dateSignature_fermeture"))}`, 105, y, { align: "center" });

    pdf.save(`PV_Fermeture_${v("nom")}.pdf`);
}

/* --- 4. TRANSPORT --- */
function genererTransport() {
    if(!logoBase64) chargerLogoBase64();
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF();
    
    dessinerCadre(pdf);

    pdf.setFontSize(10); pdf.setFont(font, "bold");
    pdf.text(`VÉHICULE : ${v("immatriculation")}`, 180, 30, { align: "right" });

    pdf.setFontSize(15); pdf.setTextColor(26, 90, 143);
    pdf.text("DÉCLARATION DE TRANSPORT DE CORPS", 105, 50, { align: "center" });
    
    const typeTransport = document.querySelector('input[name="transport_type"]:checked').value;
    const titreSous = typeTransport === "avant" ? "AVANT MISE EN BIÈRE" : "APRÈS MISE EN BIÈRE";

    pdf.setFontSize(12); pdf.setTextColor(180, 0, 0); 
    pdf.text(titreSous, 105, 58, { align: "center" });

    let y = 80; const x = 25;
    pdf.setTextColor(0); pdf.setFontSize(10);
    pdf.text("Je soussigné, M. CHERKAOUI Mustapha, Gérant des PF Solidaire,", x, y); y+=6;
    pdf.text("Déclare effectuer le transport de la personne décédée suivante :", x, y); y+=15;

    // Cadre Défunt (Fond blanc)
    pdf.setFillColor(245); pdf.rect(20, y-5, 170, 25, 'F');
    pdf.setFont(font, "bold"); pdf.text(`${v("nom")} ${v("prenom")}`, 105, y+2, { align: "center" });
    pdf.setFont(font, "normal");
    pdf.text(`Né(e) le ${formatD(v("date_naiss"))} et décédé(e) le ${formatD(v("date_deces"))}`, 105, y+10, { align: "center" });

    y += 35;
    
    pdf.setDrawColor(150); pdf.setLineWidth(0.5);
    pdf.line(105, y, 105, y+35); 
    
    pdf.setFont(font, "bold"); pdf.text("DÉPART", 60, y, { align: "center" });
    pdf.setFont(font, "normal");
    pdf.text(formatD(v("date_depart_t")) + " à " + v("heure_depart_t"), 60, y+8, { align: "center" });
    pdf.text(v("lieu_depart_t"), 60, y+16, { align: "center" });
    
    pdf.setFont(font, "bold"); pdf.text("ARRIVÉE", 150, y, { align: "center" });
    pdf.setFont(font, "normal");
    pdf.text(formatD(v("date_arrivee_t")) + " à " + v("heure_arrivee_t"), 150, y+8, { align: "center" });
    pdf.text(v("lieu_arrivee_t"), 150, y+16, { align: "center" });

    y += 50;
    pdf.text(`Fait à ${v("faita_transport")}, le ${formatD(v("dateSignature_transport"))}`, 25, y);
    
    pdf.setFont(font, "bold");
    pdf.text("Signature et Cachet", 150, y);
    
    pdf.save(`Transport_${titreSous}_${v("nom")}.pdf`);
}
