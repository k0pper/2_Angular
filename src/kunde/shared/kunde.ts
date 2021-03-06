// tslint:disable:max-file-line-count

/*
 * Copyright (C) 2015 - 2017 Juergen Zimmermann, Hochschule Karlsruhe
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

// import * as _ from 'lodash'
import * as moment from 'moment'
import 'moment/locale/de'

import {isBlank, isPresent} from '../../shared'

moment.locale('de')

// const MIN_RATING = 0
// const MAX_RATING = 5

export declare type GeschlechtType = 'M' | 'W'
export declare type FamilienstandType = 'L' | 'VH' | 'G' | 'VW'

/**
 * Gemeinsame Datenfelder unabh&auml;ngig, ob die Kundedaten von einem Server
 * (z.B. RESTful Web Service) oder von einem Formular kommen.
 */

export declare interface Adresse {
    plz: string | undefined,
    ort: string | undefined,
}

export declare interface Umsatz {
    waehrung: string | undefined,
    betrag: number | undefined,
}

export declare interface Account {
    username: string | undefined,
    password: string | undefined,
}

export interface KundeShared {
    _id?: string|undefined
    nachname?: string|undefined
    geschlecht?: GeschlechtType|undefined
    familienstand: FamilienstandType|undefined
    umsatz: Umsatz|undefined
    geburtsdatum: Array<number>|undefined
    newsletter: boolean|undefined
    email: string|undefined
    homepage: string|undefined
    adresse: Adresse
    account: Account|undefined
}

/**
 * Daten vom und zum REST-Server:
 * <ul>
 *  <li> Arrays f&uuml;r mehrere Werte, die in einem Formular als Checkbox
 *       dargestellt werden.
 *  <li> Daten mit Zahlen als Datentyp, die in einem Formular nur als
 *       String handhabbar sind.
 * </ul>
 */
export interface KundeServer extends KundeShared {
    // rating: number|undefined
    interessen?: Array<string>|undefined
    waehrung: string|undefined
}

/**
 * Daten aus einem Formular:
 * <ul>
 *  <li> je 1 Control fuer jede Checkbox und
 *  <li> au&szlig;erdem Strings f&uuml;r Eingabefelder f&uuml;r Zahlen.
 * </ul>
 */
export interface KundeForm extends KundeShared {
    // rating: string
    sport?: boolean
    lesen?: boolean
    reisen?: boolean
    plz: string|undefined
    ort: string|undefined
    waehrung: string | undefined
    betrag: number | undefined
}

/**
 * Model als Plain-Old-JavaScript-Object (POJO) fuer die Daten *UND*
 * Functions fuer Abfragen und Aenderungen.
 */
export class Kunde {
    // public ratingArray: Array<boolean> = []

    /**
     * Ein Kunde-Objekt mit JSON-Daten erzeugen, die von einem RESTful Web
     * Service kommen.
     * @param kunde JSON-Objekt mit Daten vom RESTful Web Server
     * @return Das initialisierte Kunde-Objekt
     */
    static fromServer(kundeServer: KundeServer, id: string) {
        let geburtsdatum: moment.Moment|undefined
        if (isPresent(kundeServer.geburtsdatum)) {
            const tmp = kundeServer.geburtsdatum as Array<number>
            geburtsdatum = moment(tmp)
        }
        const kunde = new Kunde(
            id.slice(id.length - 24), kundeServer.nachname/*, kundeServer.rating*/, kundeServer.familienstand,
            kundeServer.geschlecht, geburtsdatum, kundeServer.umsatz, /*kundeServer.rabatt,*/
            kundeServer.newsletter, kundeServer.interessen, kundeServer.email, kundeServer.homepage,
            kundeServer.adresse, kundeServer.waehrung, kundeServer.account)
        console.log('Kunde.fromServer(): kunde=', kunde)
        return kunde
    }

    /**
     * Ein Kunde-Objekt mit JSON-Daten erzeugen, die von einem Formular kommen.
     * @param kunde JSON-Objekt mit Daten vom Formular
     * @return Das initialisierte Kunde-Objekt
     */
    static fromForm(kundeForm: KundeForm) {
        const interessen: Array<string> = []
        if (kundeForm.sport) {
            interessen.push('S')
        }
        if (kundeForm.lesen) {
            interessen.push('L')
        }
        if (kundeForm.reisen) {
            interessen.push('R')
        }
        const adresse: Adresse = {
            plz: kundeForm.plz,
            ort: kundeForm.ort,
        }
        const umsatz: Umsatz = {
            waehrung: kundeForm.waehrung,
            betrag: kundeForm.betrag,
        }
        const account: Account = {
            username: kundeForm.email,
            password: 'p',
        }

        const datumMoment = !isPresent(kundeForm.geburtsdatum) ?
            undefined :
            moment(kundeForm.geburtsdatum as Array<number>)

        // const rabatt = kundeForm.rabatt === undefined ? 0 : kundeForm.rabatt / 100
        const kunde = new Kunde(
            kundeForm._id, kundeForm.nachname/*, +kundeForm.rating*/, kundeForm.familienstand,
            kundeForm.geschlecht, datumMoment, umsatz, /*rabatt,*/
            kundeForm.newsletter, interessen, kundeForm.email, kundeForm.homepage, adresse, kundeForm.waehrung,
            account)
        console.log('Kunde.fromForm(): kunde=', kunde)
        return kunde
    }

    // http://momentjs.com
    get datumFormatted() {
        let result: string|undefined
        if (isPresent(this.geburtsdatum)) {
            const geburtsdatum = this.geburtsdatum as moment.Moment
            result = geburtsdatum.format('Do MMM YYYY')
        }
        return result
    }

    get datumFromNow() {
        let result: string|undefined
        if (isPresent(this.geburtsdatum)) {
            const geburtsdatum = this.geburtsdatum as moment.Moment
            result = geburtsdatum.fromNow()
        }
        return result
    }

    /**
     * Abfrage, ob im Kundenachname der angegebene Teilstring enthalten ist. Dabei
     * wird nicht auf Gross-/Kleinschreibung geachtet.
     * @param nachname Zu &uuml;berpr&uuml;fender Teilstring
     * @return true, falls der Teilstring im Kundenachname enthalten ist. Sonst
     *         false.
     */
    containsNachname(nachname: string) {
        let result = true
        if (isPresent(this.nachname)) {
            const tmp = this.nachname as string
            result = tmp.toLowerCase().includes(nachname.toLowerCase())
        }
        return result
    }

    /**
     * Die Bewertung ("rating") des Kundees um 1 erh&ouml;hen
     */
    // rateUp() {
    //     if (this.rating !== undefined && this.rating < MAX_RATING) {
    //         this.rating++
    //     }
    // }

    /**
     * Die Bewertung ("rating") des Kundees um 1 erniedrigen
     */
    // rateDown() {
    //     if (this.rating !== undefined && this.rating > MIN_RATING) {
    //         this.rating--
    //     }
    // }

    /**
     * Abfrage, ob das Kunde dem angegebenen GeschlechtType zugeordnet ist.
     * @param geschlecht der Name des GeschlechtTypes
     * @return true, falls das Kunde dem GeschlechtType zugeordnet ist. Sonst false.
     */
    hasGeschlechtType(geschlecht: string) {
        return this.geschlecht === geschlecht
    }

    /**
     * Aktualisierung der Stammdaten des Kunde-Objekts.
     * @param nachname Der neue Kundenachname
     * @param familienstand Der neue Familienstand (VH, L, G oder VW)
     * @param geschlecht Der neue GeschlechtType
     * @param umsatz Der neue Umsatz
     */
    updateStammdaten(
        nachname: string, familienstand: FamilienstandType, geschlecht: GeschlechtType,
        // geburtsdatum: moment.Moment|undefined, umsatz: Umsatz|undefined
        ) {
        this.nachname = nachname
        this.familienstand = familienstand
        this.geschlecht = geschlecht
        // this.geburtsdatum = geburtsdatum
        // this.umsatz = umsatz
    }

    /**
     * Abfrage, ob es zum Kunde auch Schlagw&ouml;rter gibt.
     * @return true, falls es mindestens ein Interesse gibt. Sonst false.
     */
    hasInteresseType() {
        if (isBlank(this.interessen)) {
            return false
        }
        const tmpInteresseType = this.interessen as Array<string>
        return tmpInteresseType.length !== 0
    }

    /**
     * Abfrage, ob es zum Kunde das angegebene Interesse gibt.
     * @param interesse das zu &uuml;berpr&uuml;fende Interesse
     * @return true, falls es das Interesse gibt. Sonst false.
     */
    hasInteresse(interesse: string) {
        if (isBlank(this.interessen)) {
            return false
        }
        const tmpInteresseType = this.interessen as Array<string>
        return tmpInteresseType.includes(interesse)
    }

    /**
     * Aktualisierung der Schlagw&ouml;rter des Kunde-Objekts.
     * @param sport ist das Interesse S gesetzt
     * @param lesen ist das Interesse L gesetzt
     * @param reisen ist das Interesse R gesetzt
     */
    updateInteresseType(sport: boolean, lesen: boolean, reisen: boolean) {
        this.resetInteresseType()
        if (sport) {
            this.addInteresse('S')
        }
        if (lesen) {
            this.addInteresse('L')
        }
        if (reisen) {
            this.addInteresse('R')
        }
    }

    /**
     * Konvertierung des Kundeobjektes in ein JSON-Objekt f&uuml;r den RESTful
     * Web Service.
     * @return Das JSON-Objekt f&uuml;r den RESTful Web Service
     */
    toJSON(): KundeServer {
        const geburtsdatum = this.geburtsdatum === undefined ?
            undefined :
            this.geburtsdatum.toArray().slice(0, 3)
        return {
            _id: this._id,
            nachname: this.nachname,
            email: this.email,
            newsletter: this.newsletter,
            geburtsdatum,
            waehrung: this.waehrung,
            homepage: this.homepage,
            geschlecht: this.geschlecht,
            familienstand: this.familienstand,
            interessen: this.interessen,
            umsatz: this.umsatz,
            adresse: this.adresse,
            account: this.account,
        }
    }

    toString() {
        return JSON.stringify(this, null, 2)
    }

    // wird aufgerufen von fromServer() oder von fromForm()
    private constructor(
        // tslint:disable-next-line:variable-name
        public _id: string|undefined, public nachname: string|undefined,
        public familienstand: FamilienstandType|undefined,
        public geschlecht: GeschlechtType|undefined, public geburtsdatum: moment.Moment|undefined,
        public umsatz: Umsatz|undefined, /*public rabatt: number|undefined,*/
        public newsletter: boolean|undefined,
        public interessen: Array<string>|undefined,
        public email: string|undefined,
        public homepage: string|undefined,
        public adresse: Adresse,
        public waehrung: string|undefined,
        public account: Account|undefined) {
        this._id = _id || undefined
        this.nachname = nachname || undefined
        this.familienstand = familienstand || undefined
        this.geschlecht = geschlecht || undefined
        this.geburtsdatum =
            isPresent(geburtsdatum) ? geburtsdatum : moment(new Date().toISOString())
        this.umsatz = umsatz || undefined
        this.waehrung = waehrung
        this.account = account
        this.newsletter = newsletter || undefined

        if (isBlank(interessen)) {
            this.interessen = []
        } else {
            const tmpInteresseType = interessen as Array<string>
            this.interessen = tmpInteresseType
        }
        // if (rating !== undefined) {
        //     _.times(rating - MIN_RATING, () => this.ratingArray.push(true))
        //     _.times(MAX_RATING - rating, () => this.ratingArray.push(false))
        // }
        this.email = email || undefined
        this.homepage = homepage || undefined
        this.adresse = adresse || undefined
        this.umsatz = umsatz || undefined
        this.account = account || undefined
    }

    private resetInteresseType() {
        this.interessen = []
    }

    private addInteresse(interesse: string) {
        if (isBlank(this.interessen)) {
            this.interessen = []
        }
        const tmpInteresseType = this.interessen as Array<string>
        tmpInteresseType.push(interesse)
    }
}
