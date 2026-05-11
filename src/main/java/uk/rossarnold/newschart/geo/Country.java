package uk.rossarnold.newschart.geo;

import com.opencsv.bean.CsvBindByName;

public class Country {
    @CsvBindByName
    private double latitude;
    @CsvBindByName
    private double longitude;
    @CsvBindByName(column = "COUNTRY")
    private String name;
    @CsvBindByName(column = "ISO")
    private String iso2;
    @CsvBindByName(column = "ISO_NUMERIC")
    private String isoNumeric;

    @Override
    public boolean equals(Object o) {
        if (o == null || getClass() != o.getClass()) return false;

        Country country = (Country) o;
        return getName().equals(country.getName());
    }

    @Override
    public int hashCode() {
        return getName().hashCode();
    }

    public double getLatitude() {
        return latitude;
    }

    public void setLatitude(double latitude) {
        this.latitude = latitude;
    }

    public double getLongitude() {
        return longitude;
    }

    public void setLongitude(double longitude) {
        this.longitude = longitude;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getIso2() {
        return iso2;
    }

    public void setIso2(String iso2) {
        this.iso2 = iso2;
    }

    public String getIsoNumeric() {
        return isoNumeric;
    }

    public void setIsoNumeric(String isoNumeric) {
        this.isoNumeric = isoNumeric;
    }

    @Override
    public String toString() {
        return this.name;
    }
}
