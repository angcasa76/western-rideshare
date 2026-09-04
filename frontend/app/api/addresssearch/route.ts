import {
  NextRequest,
  NextResponse,
} from "next/server";


type PhotonFeature = {
  geometry?: {
    coordinates?: number[];
  };

  properties?: {
    name?: string;
    housenumber?: string;
    street?: string;
    locality?: string;
    district?: string;
    city?: string;
    county?: string;
    state?: string;
    postcode?: string;
    country?: string;
    countrycode?: string;
  };
};


const WESTERN_LAT =
  43.0096;

const WESTERN_LON =
  -81.2737;

const SERVICE_RADIUS_KM =
  30;


function distanceFromWesternKm(
  lat: number,
  lon: number
) {
  const toRad = (
    value: number
  ) =>
    (
      value *
      Math.PI
    ) / 180;


  const earthRadiusKm =
    6371;


  const dLat =
    toRad(
      lat -
      WESTERN_LAT
    );


  const dLon =
    toRad(
      lon -
      WESTERN_LON
    );


  const a =
    Math.sin(
      dLat / 2
    ) ** 2 +
    Math.cos(
      toRad(
        WESTERN_LAT
      )
    ) *
    Math.cos(
      toRad(
        lat
      )
    ) *
    Math.sin(
      dLon / 2
    ) ** 2;


  return (
    earthRadiusKm *
    2 *
    Math.atan2(
      Math.sqrt(a),
      Math.sqrt(
        1 - a
      )
    )
  );
}


export async function GET(
  request: NextRequest
) {
  const query =
    request
      .nextUrl
      .searchParams
      .get("q")
      ?.trim() ?? "";


  if (
    query.length < 2
  ) {
    return (
      NextResponse.json({
        suggestions: [],
      })
    );
  }


  try {
    const photonUrl =
      new URL(
        "https://photon.komoot.io/api"
      );


    photonUrl
      .searchParams
      .set(
        "q",
        query
      );


    photonUrl
      .searchParams
      .set(
        "limit",
        "8"
      );


    photonUrl
      .searchParams
      .set(
        "lang",
        "en"
      );


    photonUrl
      .searchParams
      .set(
        "lat",
        String(
          WESTERN_LAT
        )
      );


    photonUrl
      .searchParams
      .set(
        "lon",
        String(
          WESTERN_LON
        )
      );


    const response =
      await fetch(
        photonUrl.toString(),
        {
          method: "GET",

          headers: {
            Accept:
              "application/json",
          },

          cache:
            "no-store",
        }
      );


    if (
      !response.ok
    ) {
      console.error(
        "Photon error:",
        response.status,
        await response.text()
      );


      return (
        NextResponse.json({
          suggestions: [],
        })
      );
    }


    const data =
      await response.json();


    const features:
      PhotonFeature[] =
      Array.isArray(
        data.features
      )
        ? data.features
        : [];


    const suggestions =
      features

        .map(
          (
            feature
          ) => {

            const properties =
              feature
                .properties ??
              {};


            const coordinates =
              feature
                .geometry
                ?.coordinates;


            if (
              !coordinates ||
              coordinates.length
              < 2
            ) {
              return null;
            }


            const lon =
              Number(
                coordinates[0]
              );


            const lat =
              Number(
                coordinates[1]
              );


            if (
              Number.isNaN(
                lat
              ) ||
              Number.isNaN(
                lon
              )
            ) {
              return null;
            }


            if (
              distanceFromWesternKm(
                lat,
                lon
              )
              >
              SERVICE_RADIUS_KM
            ) {
              return null;
            }


            const streetAddress =
              [
                properties
                  .housenumber,

                properties
                  .street,
              ]
                .filter(
                  Boolean
                )
                .join(
                  " "
                );


            const city =
              properties.city ||
              properties.locality ||
              properties.district ||
              properties.county;


            const firstLine =
              streetAddress ||
              properties.name ||
              "";


            const addressParts =
              [
                firstLine,
                city,
                properties.state,
                properties.postcode,
                properties.country,
              ]
                .filter(
                  (
                    part,
                    index,
                    array
                  ) =>
                    Boolean(
                      part
                    ) &&
                    array.indexOf(
                      part
                    ) === index
                );


            const address =
              addressParts
                .join(
                  ", "
                );


            if (
              !address
            ) {
              return null;
            }


            return {
              address,
              lat,
              lon,
            };
          }
        )

        .filter(
          (
            suggestion
          ): suggestion is {
            address: string;
            lat: number;
            lon: number;
          } =>
            suggestion !==
            null
        );


    return (
      NextResponse.json({
        suggestions,
      })
    );

  } catch (
    error
  ) {

    console.error(
      "Address search failed:",
      error
    );


    return (
      NextResponse.json({
        suggestions: [],
      })
    );
  }
}